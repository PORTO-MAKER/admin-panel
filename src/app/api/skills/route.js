import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Skill from "../../../models/Skill";
import minioClient from "../../../lib/minio";

export async function GET(request) {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("name") || "";
    const skip = (page - 1) * limit;

    const filter = searchQuery
        ? { name: { $regex: searchQuery, $options: "i" } }
        : {};

    try {
        const totalSkills = await Skill.countDocuments(filter);
        const skills = await Skill.find(filter)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const skillsWithUrls = skills.map((skill) => {
            const baseUrl = `https://${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/skill_icons`;
            return {
                ...skill,
                lightColorPath: `${baseUrl}/${skill.lightColorPath}`,
                darkColorPath: `${baseUrl}/${skill.darkColorPath}`,
            };
        });

        return NextResponse.json({
            success: true,
            data: skillsWithUrls,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalSkills / limit),
                totalSkills: totalSkills,
            },
        });
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function POST(request) {
    await dbConnect();
    const formData = await request.formData();
    const name = formData.get("name");
    const lightImage = formData.get("lightImage");
    const darkImage = formData.get("darkImage");

    if (!name || !lightImage || !darkImage) {
        return NextResponse.json(
            { success: false, error: "Semua field wajib diisi" },
            { status: 400 }
        );
    }

    const transformedName = name.toLowerCase().replace(/\s+/g, "-");
    const lightImageName = `${transformedName}-light.svg`;
    const darkImageName = `${transformedName}-dark.svg`;

    try {
        const existingSkill = await Skill.findOne({ name: transformedName });
        if (existingSkill) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Skill dengan nama "${transformedName}" sudah ada.`,
                },
                { status: 409 }
            );
        }

        const lightImageBuffer = Buffer.from(await lightImage.arrayBuffer());
        const darkImageBuffer = Buffer.from(await darkImage.arrayBuffer());

        await minioClient.putObject(
            process.env.MINIO_BUCKET,
            `skill_icons/${lightImageName}`,
            lightImageBuffer,
            { "Content-Type": "image/svg+xml" }
        );
        await minioClient.putObject(
            process.env.MINIO_BUCKET,
            `skill_icons/${darkImageName}`,
            darkImageBuffer,
            { "Content-Type": "image/svg+xml" }
        );

        const newSkill = new Skill({
            name: transformedName,
            lightColorPath: lightImageName,
            darkColorPath: darkImageName,
        });
        await newSkill.save();

        return NextResponse.json(
            { success: true, data: newSkill },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST Error:", error);
        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Skill dengan nama "${transformedName}" sudah ada.`,
                },
                { status: 409 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Terjadi kesalahan tidak diketahui",
            },
            { status: 400 }
        );
    }
}

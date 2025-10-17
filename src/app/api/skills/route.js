import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import Skill from "../../../models/Skill";
import SkillCategory from "../../../models/SkillCategory";
import minioClient from "../../../lib/minio";
import mongoose from "mongoose";

export async function GET(request) {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const searchQuery = searchParams.get("name") || "";
    const categoryId = searchParams.get("category") || "all";
    const skip = (page - 1) * limit;

    let filter = {};
    if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: "i" };
    }

    try {
        if (categoryId && categoryId !== "all") {
            const category = await SkillCategory.findById(categoryId).lean();
            if (category) {
                filter._id = {
                    $in: category.skills.map(
                        (id) => new mongoose.Types.ObjectId(id)
                    ),
                };
            } else {
                return NextResponse.json({
                    success: true,
                    data: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalSkills: 0,
                    },
                });
            }
        }

        const totalSkills = await Skill.countDocuments(filter);

        const skillsPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "skillcategories",
                    localField: "_id",
                    foreignField: "skills",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: {
                    path: "$categoryInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    categoryName: "$categoryInfo.name",
                    categoryId: "$categoryInfo._id",
                },
            },
            {
                $project: {
                    categoryInfo: 0,
                },
            },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limit },
        ];

        const skills = await Skill.aggregate(skillsPipeline);

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
    const categoryId = formData.get("category");

    if (!name || !lightImage || !darkImage || !categoryId) {
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

        await SkillCategory.findByIdAndUpdate(categoryId, {
            $push: { skills: newSkill._id },
        });

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

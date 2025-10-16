import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Skill from "../../../../models/Skill";
import minioClient from "../../../../lib/minio";
import { CopyConditions } from "minio";

export async function GET(request, { params }) {
    await dbConnect();
    try {
        const skill = await Skill.findById(params.id);
        if (!skill) {
            return NextResponse.json(
                { success: false, error: "Skill not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: skill });
    } catch (error) {
        console.error(`GET /api/skills/${params.id} Error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function PUT(request, { params }) {
    await dbConnect();
    const formData = await request.formData();
    const name = formData.get("name");
    const lightImage = formData.get("lightImage");
    const darkImage = formData.get("darkImage");

    const transformedName = name.toLowerCase().replace(/\s+/g, "-");
    const newLightImageName = `${transformedName}-light.svg`;
    const newDarkImageName = `${transformedName}-dark.svg`;

    try {
        const existingSkill = await Skill.findOne({
            name: transformedName,
            _id: { $ne: params.id },
        });
        if (existingSkill) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Skill dengan nama "${transformedName}" sudah ada.`,
                },
                { status: 409 }
            );
        }

        const skill = await Skill.findById(params.id);
        if (!skill) {
            return NextResponse.json(
                { success: false, error: "Skill not found" },
                { status: 404 }
            );
        }

        let finalLightPath = skill.lightColorPath;
        let finalDarkPath = skill.darkColorPath;
        const bucketName = process.env.MINIO_BUCKET;

        if (lightImage && lightImage.size > 0) {
            const lightImageBuffer = Buffer.from(
                await lightImage.arrayBuffer()
            );
            await minioClient.putObject(
                bucketName,
                `skill_icons/${newLightImageName}`,
                lightImageBuffer,
                { "Content-Type": "image/svg+xml" }
            );
            if (skill.lightColorPath !== newLightImageName) {
                await minioClient.removeObject(
                    bucketName,
                    `skill_icons/${skill.lightColorPath}`
                );
            }
            finalLightPath = newLightImageName;
        } else if (skill.lightColorPath !== newLightImageName) {
            await minioClient.copyObject(
                bucketName,
                `skill_icons/${newLightImageName}`,
                `${bucketName}/skill_icons/${skill.lightColorPath}`,
                new CopyConditions()
            );
            await minioClient.removeObject(
                bucketName,
                `skill_icons/${skill.lightColorPath}`
            );
            finalLightPath = newLightImageName;
        }

        if (darkImage && darkImage.size > 0) {
            const darkImageBuffer = Buffer.from(await darkImage.arrayBuffer());
            await minioClient.putObject(
                bucketName,
                `skill_icons/${newDarkImageName}`,
                darkImageBuffer,
                { "Content-Type": "image/svg+xml" }
            );
            if (skill.darkColorPath !== newDarkImageName) {
                await minioClient.removeObject(
                    bucketName,
                    `skill_icons/${skill.darkColorPath}`
                );
            }
            finalDarkPath = newDarkImageName;
        } else if (skill.darkColorPath !== newDarkImageName) {
            await minioClient.copyObject(
                bucketName,
                `skill_icons/${newDarkImageName}`,
                `${bucketName}/skill_icons/${skill.darkColorPath}`,
                new CopyConditions()
            );
            await minioClient.removeObject(
                bucketName,
                `skill_icons/${skill.darkColorPath}`
            );
            finalDarkPath = newDarkImageName;
        }

        const updatedSkill = await Skill.findByIdAndUpdate(
            params.id,
            {
                name: transformedName,
                lightColorPath: finalLightPath,
                darkColorPath: finalDarkPath,
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: updatedSkill });
    } catch (error) {
        console.error(`PUT /api/skills/${params.id} Error:`, error);
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
                error: error.message || "An unknown error occurred",
            },
            { status: 400 }
        );
    }
}

export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const skill = await Skill.findById(params.id);
        if (!skill) {
            return NextResponse.json(
                { success: false, error: "Skill not found" },
                { status: 404 }
            );
        }

        await minioClient.removeObject(
            process.env.MINIO_BUCKET,
            `skill_icons/${skill.lightColorPath}`
        );
        await minioClient.removeObject(
            process.env.MINIO_BUCKET,
            `skill_icons/${skill.darkColorPath}`
        );

        const deletedSkill = await Skill.deleteOne({ _id: params.id });
        if (!deletedSkill) {
            return NextResponse.json({ success: false }, { status: 400 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error(`DELETE /api/skills/${params.id} Error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Skill from "../../../../models/Skill";
import SkillCategory from "../../../../models/SkillCategory";
import minioClient from "../../../../lib/minio";
import { CopyConditions } from "minio";

export async function GET(request, { params }) {
    await dbConnect();
    const { id } = await params;
    try {
        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json(
                { success: false, error: "Skill not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: skill });
    } catch (error) {
        console.error(`GET /api/skills/${id} Error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function PUT(request, { params }) {
    await dbConnect();
    const { id } = await params;
    const formData = await request.formData();
    const name = formData.get("name");
    const lightImage = formData.get("lightImage");
    const darkImage = formData.get("darkImage");
    const categoryId = formData.get("category");

    const transformedName = name.toLowerCase().replace(/\s+/g, "-");
    const newLightImageName = `${transformedName}-light.svg`;
    const newDarkImageName = `${transformedName}-dark.svg`;

    try {
        const skill = await Skill.findById(id);
        if (!skill) {
            return NextResponse.json(
                { success: false, error: "Skill not found" },
                { status: 404 }
            );
        }

        const oldCategory = await SkillCategory.findOne({ skills: id });

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

        const updatedSkillData = {
            name,
            lightColorPath: finalLightPath,
            darkColorPath: finalDarkPath,
        };

        const updatedSkill = await Skill.findByIdAndUpdate(
            id,
            updatedSkillData,
            { new: true }
        );

        if (oldCategory && oldCategory._id.toString() !== categoryId) {
            await SkillCategory.findByIdAndUpdate(oldCategory._id, {
                $pull: { skills: id },
            });
            await SkillCategory.findByIdAndUpdate(categoryId, {
                $push: { skills: id },
            });
        } else if (!oldCategory && categoryId) {
            await SkillCategory.findByIdAndUpdate(categoryId, {
                $push: { skills: id },
            });
        }

        return NextResponse.json({ success: true, data: updatedSkill });
    } catch (error) {
        console.error(`PUT /api/skills/${id} Error:`, error);
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
    const { id } = await params;
    try {
        const skill = await Skill.findById(id);
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

        await SkillCategory.updateMany(
            { skills: id },
            { $pull: { skills: id } }
        );

        await Skill.deleteOne({ _id: id });

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        console.error(`DELETE /api/skills/${id} Error:`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

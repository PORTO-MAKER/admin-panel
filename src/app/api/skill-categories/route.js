import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import SkillCategory from "../../../models/SkillCategory";

export async function GET(request) {
    await dbConnect();
    try {
        const categories = await SkillCategory.find({})
            .populate("skills")
            .sort({ name: 1 });
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json(
                { success: false, error: "Nama kategori diperlukan" },
                { status: 400 }
            );
        }
        const newCategory = new SkillCategory({ name });
        await newCategory.save();
        return NextResponse.json(
            { success: true, data: newCategory },
            { status: 201 }
        );
    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Kategori dengan nama "${name}" sudah ada.`,
                },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

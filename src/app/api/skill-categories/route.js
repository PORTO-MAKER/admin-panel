import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import SkillCategory from "../../../models/SkillCategory";
import { createHash } from "crypto";

export async function GET(request) {
    await dbConnect();
    try {
        const categories = await SkillCategory.find({})
            .select("name skills")
            .sort({ name: 1 });

        const body = JSON.stringify({ success: true, data: categories });
        const etag = `"${createHash("sha1").update(body).digest("hex")}"`;

        const ifNoneMatch = request.headers.get("if-none-match");
        if (ifNoneMatch === etag) {
            return new NextResponse(null, { status: 304 });
        }

        return new NextResponse(body, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control":
                    "public, max-age=60, s-maxage=60, stale-while-revalidate=86400",
                ETag: etag,
            },
        });
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

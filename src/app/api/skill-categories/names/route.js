import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import SkillCategory from "../../../../models/SkillCategory";
import { createHash } from "crypto";

export async function GET(request) {
    await dbConnect();
    try {
        const categories = await SkillCategory.find({})
            .select("_id name")
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
                "Cache-Control":
                    "private, max-age=60, s-maxage=60, stale-while-revalidate=86400",
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

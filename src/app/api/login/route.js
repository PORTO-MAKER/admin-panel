import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const PASSWORD = process.env.PASSWORD;

export async function POST(request) {
    try {
        const { password } = await request.json();

        if (password === PASSWORD) {
            const cookieStore = cookies();
            cookieStore.set("auth-token", "true", {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24,
            });
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: "Password salah" },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}

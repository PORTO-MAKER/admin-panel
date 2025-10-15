import { NextResponse } from "next/server";

export function middleware(request) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
        const secretCode = request.headers.get("x-secret-code");
        // Gunakan variabel environment yang baru
        const expectedSecret = process.env.NEXT_PUBLIC_API_SECRET_KEY;

        if (secretCode !== expectedSecret) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: "/api/:path*",
};

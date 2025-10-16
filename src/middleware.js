import { NextResponse } from "next/server";

export function middleware(request) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
        if (pathname.startsWith("/api/login")) {
            return NextResponse.next();
        }

        const secretCode = request.headers.get("x-secret-code");
        const expectedSecret = process.env.NEXT_PUBLIC_API_SECRET_KEY;

        if (secretCode !== expectedSecret) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    const authToken = request.cookies.get("auth-token")?.value;

    if (!authToken && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (authToken && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

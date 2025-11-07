import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0"

export async function middleware(request) {
    const authRes = await auth0.middleware(request);
    const hostname = request.headers.get('host') || '';

    // Check subdomain
    const isVerifyDomain = hostname.startsWith('verify.');
    const isAdminDomain = hostname.startsWith('admin.');

    // VERIFY SUBDOMAIN: verify.mastis.co.uk/[uuid]
    if (isVerifyDomain) {
        // All routes on verify domain are public (no auth needed)
        return authRes;
    }

    // ADMIN SUBDOMAIN: admin.mastis.co.uk
    if (isAdminDomain) {
        // Block /verify routes on admin subdomain
        if (request.nextUrl.pathname.startsWith('/verify')) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin';
            return NextResponse.redirect(url);
        }
    }

    // authentication routes — let the middleware handle it
    if (request.nextUrl.pathname.startsWith("/auth")) {
        return authRes;
    }

    // public routes — /verify is public
    if (request.nextUrl.pathname.startsWith("/verify")) {
        return authRes;
    }

    const { origin } = new URL(request.url)
    const session = await auth0.getSession()

    // user does not have a session — redirect to login
    if (!session) {
        return NextResponse.redirect(`${origin}/auth/login`)
    }

    return authRes
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - api (API routes)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)",
    ],
}
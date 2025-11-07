import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0"

export async function middleware(request) {
    const authRes = await auth0.middleware(request);
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';

    // Detect subdomain
    const isVerifyDomain = hostname.startsWith('verify.');
    const isAdminDomain = hostname.startsWith('admin.');

    // VERIFY SUBDOMAIN: verify.mastis.co.uk/[uuid]
    if (isVerifyDomain) {
        // Only allow /verify routes on verify subdomain
        if (!url.pathname.startsWith('/verify') && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
            // Redirect root or any other route to invalid link page
            url.pathname = '/verify/invalid-link';
            return NextResponse.redirect(url);
        }
        // Allow /verify routes (public, no auth needed)
        return authRes;
    }

    // ADMIN SUBDOMAIN: admin.mastis.co.uk
    if (isAdminDomain) {
        // Block /verify routes on admin subdomain
        if (url.pathname.startsWith('/verify')) {
            url.pathname = '/admin';
            return NextResponse.redirect(url);
        }
        // Continue with normal admin auth flow below
    }

    // authentication routes — let the middleware handle it
    if (request.nextUrl.pathname.startsWith("/auth")) {
        return authRes;
    }

    // public routes on verify subdomain
    if (request.nextUrl.pathname.startsWith("/verify")) {
        return authRes;
    }

    // Check session for admin routes
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
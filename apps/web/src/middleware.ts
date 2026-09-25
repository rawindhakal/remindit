import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/mobile") || pathname.startsWith("/uploads")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, Accept, X-Requested-With, Range",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, X-Requested-With, Range"
    );
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/mobile/:path*", "/uploads/:path*"],
};

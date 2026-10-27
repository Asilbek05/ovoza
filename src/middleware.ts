import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE, authSecret } from "@/lib/secret";

/** Gate every /admin page before it renders (server actions re-check on their own). */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  try {
    if (token) {
      const { payload } = await jwtVerify(token, authSecret());
      if (payload.admin === true) return NextResponse.next();
    }
  } catch {
    /* fall through to login */
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };

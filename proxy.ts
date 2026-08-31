import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_PREFIX = "sb-";

function tieneSesionValida(request: NextRequest): boolean {
  const ref =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] ??
    "";
  const tokenKey = ref ? `${SESSION_COOKIE_PREFIX}${ref}-auth-token` : "";

  const raw = tokenKey ? request.cookies.get(tokenKey)?.value : null;
  if (!raw) return false;

  try {
    const sesion = JSON.parse(raw);
    const accessToken: unknown = sesion?.access_token;
    if (typeof accessToken !== "string" || !accessToken) return false;

    const partes = accessToken.split(".");
    if (partes.length < 2) return false;
    const cuerpo = JSON.parse(
      Buffer.from(partes[1], "base64url").toString("utf-8")
    ) as { exp?: number };

    const exp = Number(cuerpo.exp ?? 0);
    return exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (!tieneSesionValida(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
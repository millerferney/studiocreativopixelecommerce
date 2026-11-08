import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Next.js 16: `proxy.ts` reemplaza a `middleware.ts`.
 * Filtro RÁPIDO de rutas (solo verifica la firma del JWT). La autorización real, con el estado y los roles
 * leídos de la BD, se repite en cada Route Handler y Server Component (defensa en profundidad).
 */
const COOKIE = "scp_session";

async function leer(token?: string) {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), { algorithms: ["HS256"] });
    return { roles: (payload.roles as string[]) ?? [] };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sesion = await leer(req.cookies.get(COOKIE)?.value);

  const aLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  };

  if (pathname.startsWith("/admin")) {
    if (!sesion) return aLogin();
    if (!sesion.roles.includes("ADMINISTRADOR")) return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/cuenta") || pathname.startsWith("/factura")) {
    if (!sesion) return aLogin();
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/cuenta/:path*", "/factura/:path*"] };

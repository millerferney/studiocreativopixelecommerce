import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

/** Mismo formato que GlobalExceptionHandler de pixel-api: { status, message, fieldErrors }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (m: string, f?: Record<string, string>) => new ApiError(400, m, f);
export const unauthorized = (m = "Debes iniciar sesión.") => new ApiError(401, m);
export const forbidden = (m = "No tienes permisos para esta acción.") => new ApiError(403, m);
export const notFound = (m: string) => new ApiError(404, m);
export const conflict = (m: string) => new ApiError(409, m);

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return NextResponse.json({ status: e.status, message: e.message, fieldErrors: e.fieldErrors ?? null }, { status: e.status });
  }
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of e.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    return NextResponse.json({ status: 400, message: "Datos inválidos.", fieldErrors }, { status: 400 });
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return NextResponse.json({ status: 409, message: "Ya existe un registro con esos datos.", fieldErrors: null }, { status: 409 });
    if (e.code === "P2003") return NextResponse.json({ status: 409, message: "No se puede completar: el registro tiene datos relacionados.", fieldErrors: null }, { status: 409 });
    if (e.code === "P2025") return NextResponse.json({ status: 404, message: "Registro no encontrado.", fieldErrors: null }, { status: 404 });
  }
  console.error("[api] error no controlado:", e instanceof Error ? e.message : e);
  return NextResponse.json({ status: 500, message: "Error interno del servidor.", fieldErrors: null }, { status: 500 });
}

type Handler<C> = (req: Request, ctx: C) => Promise<NextResponse | Response>;

/** Envuelve un Route Handler: captura errores y los responde con el formato estándar. */
export function api<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export async function leerJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw badRequest("El cuerpo de la petición no es JSON válido.");
  }
}

export function idParam(valor: string, nombre = "id"): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`El ${nombre} indicado no es válido.`);
  return n;
}

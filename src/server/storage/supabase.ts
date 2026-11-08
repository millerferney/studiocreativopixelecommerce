import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError, badRequest } from "@/lib/http";

/** Subida de archivos de diseño a Supabase Storage vía REST (sin SDK). Bucket PRIVADO "disenos". */
const MAX_BYTES = 10 * 1024 * 1024;
const PERMITIDOS: Record<string, string[]> = {
  png: ["image/png"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], svg: ["image/svg+xml"],
  pdf: ["application/pdf"], ai: ["application/postscript", "application/illustrator", "application/pdf", "application/octet-stream"],
  psd: ["image/vnd.adobe.photoshop", "application/octet-stream"],
};

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ApiError(503, "El almacenamiento de archivos no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return { url: url.replace(/\/$/, ""), key, bucket: process.env.SUPABASE_BUCKET ?? "disenos" };
}

export async function subirDiseno(idUsuario: number, file: File): Promise<{ path: string; nombre: string }> {
  const { url, key, bucket } = cfg();
  if (file.size === 0) throw badRequest("El archivo está vacío.");
  if (file.size > MAX_BYTES) throw badRequest("El archivo supera el máximo de 10 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimes = PERMITIDOS[ext];
  if (!mimes) throw badRequest("Formato no permitido. Usa PNG, JPG, SVG, PDF, AI o PSD.");
  if (file.type && !mimes.includes(file.type)) throw badRequest("El tipo de archivo no coincide con su extensión.");
  const limpio = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const path = `${idUsuario}/${randomUUID()}-${limpio}`;
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) {
    console.error("[storage] fallo al subir", res.status);
    throw new ApiError(502, "No se pudo guardar el archivo. Inténtalo de nuevo.");
  }
  return { path, nombre: file.name };
}

/** URL firmada temporal (10 min) para que el equipo de producción descargue el archivo. */
export async function urlFirmada(path: string): Promise<string | null> {
  try {
    const { url, key, bucket } = cfg();
    const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 600 }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { signedURL?: string };
    return j.signedURL ? `${url}/storage/v1${j.signedURL}` : null;
  } catch {
    return null;
  }
}

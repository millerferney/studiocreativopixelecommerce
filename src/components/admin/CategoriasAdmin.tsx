"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api, ApiClientError } from "@/lib/api-client";
import { mensajeError, useToast } from "@/components/providers/AppProviders";
import { Campo, Confirmar, Encabezado, Modal, Vacio } from "./ui";

interface Cat { idCategoria: number; nombre: string; descripcion: string | null; totalServicios: number }

export function CategoriasAdmin({ categorias }: { categorias: Cat[] }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState<Cat | "nueva" | null>(null);
  const [borrar, setBorrar] = useState<Cat | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  async function guardar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const body = { nombre: f.get("nombre"), descripcion: f.get("descripcion") };
    setCargando(true); setErrores({});
    try {
      if (edit === "nueva") await api("/api/categorias", { body });
      else if (edit) await api(`/api/categorias/${edit.idCategoria}`, { method: "PUT", body });
      toast("success", edit === "nueva" ? "Categoría creada" : "Categoría actualizada");
      setEdit(null); router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError && e.fieldErrors) setErrores(e.fieldErrors);
      else toast("error", mensajeError(e));
    } finally { setCargando(false); }
  }
  async function eliminar() {
    if (!borrar) return;
    setCargando(true);
    try { await api(`/api/categorias/${borrar.idCategoria}`, { method: "DELETE" }); toast("success", "Categoría eliminada"); setBorrar(null); router.refresh(); }
    catch (e) { toast("error", mensajeError(e)); setBorrar(null); } finally { setCargando(false); }
  }

  const actual = edit && edit !== "nueva" ? edit : null;
  return (
    <section>
      <Encabezado titulo="Categorías" sub="Agrupan los productos y servicios del catálogo" accion={<button className="adm-btn-primary" onClick={() => { setErrores({}); setEdit("nueva"); }}><Icon name="plus" className="w-4 h-4 inline mr-1" />Nueva categoría</button>} />
      <div className="adm-card p-0 overflow-x-auto">
        {categorias.length === 0 ? <Vacio texto="No hay categorías registradas." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de categorías</caption>
            <thead><tr><th scope="col">ID</th><th scope="col">Nombre</th><th scope="col">Descripción</th><th scope="col">Productos</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.idCategoria}>
                  <td className="font-mono text-px-faint">{c.idCategoria}</td>
                  <td className="font-semibold">{c.nombre}</td>
                  <td className="text-px-muted">{c.descripcion ?? "—"}</td>
                  <td><span className="adm-badge adm-badge-cyan">{c.totalServicios}</span></td>
                  <td className="text-right whitespace-nowrap">
                    <button className="adm-btn-icon" aria-label={`Editar ${c.nombre}`} onClick={() => { setErrores({}); setEdit(c); }}><Icon name="pencil" className="w-4 h-4" /></button>
                    <button className="adm-btn-icon" aria-label={`Eliminar ${c.nombre}`} onClick={() => setBorrar(c)}><Icon name="trash-2" className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edit && (
        <Modal titulo={edit === "nueva" ? "Nueva categoría" : "Editar categoría"} onCerrar={() => setEdit(null)}>
          <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
            <Campo id="cat-nombre" label="Nombre" error={errores.nombre}><input id="cat-nombre" name="nombre" className="adm-field-input" defaultValue={actual?.nombre ?? ""} maxLength={80} /></Campo>
            <Campo id="cat-desc" label="Descripción" error={errores.descripcion}><textarea id="cat-desc" name="descripcion" className="adm-field-textarea" rows={3} defaultValue={actual?.descripcion ?? ""} maxLength={255} /></Campo>
            <div className="flex justify-end gap-3 mt-2"><button type="button" className="adm-btn-secondary" onClick={() => setEdit(null)}>Cancelar</button><button className="adm-btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Guardar"}</button></div>
          </form>
        </Modal>
      )}
      {borrar && <Confirmar titulo="Eliminar categoría" mensaje={`¿Eliminar la categoría "${borrar.nombre}"? Esta acción no se puede deshacer.`} onSi={eliminar} onNo={() => setBorrar(null)} cargando={cargando} />}
    </section>
  );
}

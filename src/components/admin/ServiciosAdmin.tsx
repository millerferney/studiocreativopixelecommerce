"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api, ApiClientError } from "@/lib/api-client";
import { formatCOP } from "@/lib/money";
import { mensajeError, useToast } from "@/components/providers/AppProviders";
import type { ServicioDTO } from "@/server/dto";
import { Campo, Confirmar, Encabezado, Modal, Vacio } from "./ui";

export function ServiciosAdmin({ servicios, categorias }: { servicios: ServicioDTO[]; categorias: { idCategoria: number; nombre: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState<ServicioDTO | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<ServicioDTO | null>(null);
  const [filtro, setFiltro] = useState("all");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const lista = filtro === "all" ? servicios : servicios.filter((s) => String(s.idCategoria) === filtro);
  const actual = edit && edit !== "nuevo" ? edit : null;
  const csv = (v: FormDataEntryValue | null) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

  async function guardar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const body = {
      nombre: f.get("nombre"), descripcion: f.get("descripcion"), precio: f.get("precio"), tiempoEntrega: f.get("tiempoEntrega"),
      estado: f.get("estado"), tipo: f.get("tipo"), imagenUrl: f.get("imagenUrl"), badge: f.get("badge"), destacado: f.get("destacado") === "on",
      idCategoria: f.get("idCategoria"), tallas: csv(f.get("tallas")), materiales: csv(f.get("materiales")),
    };
    setCargando(true); setErrores({});
    try {
      if (edit === "nuevo") await api("/api/servicios", { body }); else if (actual) await api(`/api/servicios/${actual.idServicio}`, { method: "PUT", body });
      toast("success", edit === "nuevo" ? "Producto creado" : "Producto actualizado");
      setEdit(null); router.refresh();
    } catch (e) { if (e instanceof ApiClientError && e.fieldErrors) setErrores(e.fieldErrors); else toast("error", mensajeError(e)); }
    finally { setCargando(false); }
  }
  async function eliminar() {
    if (!borrar) return;
    setCargando(true);
    try { await api(`/api/servicios/${borrar.idServicio}`, { method: "DELETE" }); toast("success", "Producto eliminado"); setBorrar(null); router.refresh(); }
    catch (e) { toast("error", mensajeError(e)); setBorrar(null); } finally { setCargando(false); }
  }

  return (
    <section>
      <Encabezado titulo="Servicios y productos" sub="Catálogo que ve el cliente en la tienda" accion={
        <div className="flex gap-3">
          <select aria-label="Filtrar por categoría" className="adm-field-select w-52" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categorias.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
          </select>
          <button className="adm-btn-primary whitespace-nowrap" onClick={() => { setErrores({}); setEdit("nuevo"); }}><Icon name="plus" className="w-4 h-4 inline mr-1" />Nuevo</button>
        </div>
      } />
      <div className="adm-card p-0 overflow-x-auto">
        {lista.length === 0 ? <Vacio texto="No hay productos para mostrar." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de servicios y productos</caption>
            <thead><tr><th scope="col">Producto</th><th scope="col">Categoría</th><th scope="col">Tipo</th><th scope="col">Precio</th><th scope="col">Entrega</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.idServicio}>
                  <td>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imagenUrl ?? "/assets/brand/Chartlogo.svg"} alt="" className="w-10 h-10 rounded object-cover bg-px-base" />
                      <div><div className="font-semibold">{s.nombre}</div>{s.destacado && <span className="font-mono text-[10px] text-px-purple">DESTACADO</span>}</div>
                    </div>
                  </td>
                  <td className="text-px-muted">{s.nombreCategoria}</td>
                  <td className="text-px-muted">{s.tipo === "PRODUCTO" ? "Producto" : "Servicio"}</td>
                  <td className="font-mono">{formatCOP(s.precio)}</td>
                  <td className="text-px-muted">{s.tiempoEntrega} d</td>
                  <td><span className={`adm-badge ${s.estado === "DISPONIBLE" ? "adm-badge-green" : "adm-badge-danger"}`}>{s.estado === "DISPONIBLE" ? "Disponible" : "No disponible"}</span></td>
                  <td className="text-right whitespace-nowrap">
                    <button className="adm-btn-icon" aria-label={`Editar ${s.nombre}`} onClick={() => { setErrores({}); setEdit(s); }}><Icon name="pencil" className="w-4 h-4" /></button>
                    <button className="adm-btn-icon" aria-label={`Eliminar ${s.nombre}`} onClick={() => setBorrar(s)}><Icon name="trash-2" className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edit && (
        <Modal titulo={edit === "nuevo" ? "Nuevo producto o servicio" : "Editar producto o servicio"} onCerrar={() => setEdit(null)} ancho="max-w-2xl">
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <div className="md:col-span-2"><Campo id="sv-nombre" label="Nombre" error={errores.nombre}><input id="sv-nombre" name="nombre" className="adm-field-input" defaultValue={actual?.nombre ?? ""} maxLength={120} /></Campo></div>
            <div className="md:col-span-2"><Campo id="sv-desc" label="Descripción" error={errores.descripcion}><textarea id="sv-desc" name="descripcion" rows={2} className="adm-field-textarea" defaultValue={actual?.descripcion ?? ""} /></Campo></div>
            <Campo id="sv-precio" label="Precio (COP, sin IVA)" error={errores.precio}><input id="sv-precio" name="precio" type="number" min="1" step="1" className="adm-field-input" defaultValue={actual?.precio ?? ""} /></Campo>
            <Campo id="sv-dias" label="Tiempo de entrega (días hábiles)" error={errores.tiempoEntrega}><input id="sv-dias" name="tiempoEntrega" type="number" min="1" className="adm-field-input" defaultValue={actual?.tiempoEntrega ?? ""} /></Campo>
            <Campo id="sv-cat" label="Categoría" error={errores.idCategoria}>
              <select id="sv-cat" name="idCategoria" className="adm-field-select" defaultValue={actual?.idCategoria ?? ""}>
                <option value="">Selecciona…</option>{categorias.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="sv-tipo" label="Tipo"><select id="sv-tipo" name="tipo" className="adm-field-select" defaultValue={actual?.tipo ?? "PRODUCTO"}><option value="PRODUCTO">Producto</option><option value="SERVICIO">Servicio</option></select></Campo>
            <Campo id="sv-estado" label="Estado"><select id="sv-estado" name="estado" className="adm-field-select" defaultValue={actual?.estado ?? "DISPONIBLE"}><option value="DISPONIBLE">Disponible</option><option value="NO_DISPONIBLE">No disponible</option></select></Campo>
            <Campo id="sv-badge" label="Insignia (OFERTA, NUEVO, PRO…)" error={errores.badge}><input id="sv-badge" name="badge" className="adm-field-input" defaultValue={actual?.badge ?? ""} maxLength={20} /></Campo>
            <div className="md:col-span-2"><Campo id="sv-img" label="Imagen (ruta, p. ej. /assets/productos/mi-producto.jpg)" error={errores.imagenUrl}><input id="sv-img" name="imagenUrl" className="adm-field-input" defaultValue={actual?.imagenUrl ?? ""} /></Campo></div>
            <Campo id="sv-tallas" label="Tallas (separadas por coma)"><input id="sv-tallas" name="tallas" className="adm-field-input" defaultValue={actual?.tallas.join(", ") ?? ""} placeholder="S, M, L" /></Campo>
            <Campo id="sv-mats" label="Materiales (separados por coma)"><input id="sv-mats" name="materiales" className="adm-field-input" defaultValue={actual?.materiales.join(", ") ?? ""} placeholder="Algodón, Poliéster" /></Campo>
            <label className="md:col-span-2 flex items-center gap-3 font-body text-sm text-px-muted"><input type="checkbox" name="destacado" defaultChecked={actual?.destacado} style={{ accentColor: "rgb(var(--c-cyan))" }} /> Mostrar en “Productos destacados”</label>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2"><button type="button" className="adm-btn-secondary" onClick={() => setEdit(null)}>Cancelar</button><button className="adm-btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Guardar"}</button></div>
          </form>
        </Modal>
      )}
      {borrar && <Confirmar titulo="Eliminar producto" mensaje={`¿Eliminar "${borrar.nombre}"? Si ya fue vendido, márcalo como "No disponible" en su lugar.`} onSi={eliminar} onNo={() => setBorrar(null)} cargando={cargando} />}
    </section>
  );
}

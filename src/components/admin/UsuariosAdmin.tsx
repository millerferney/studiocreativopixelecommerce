"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api, ApiClientError } from "@/lib/api-client";
import { mensajeError, useToast } from "@/components/providers/AppProviders";
import type { UsuarioDTO } from "@/server/dto";
import { Campo, Confirmar, Encabezado, Modal, Vacio } from "./ui";

export function UsuariosAdmin({ usuarios, yo }: { usuarios: UsuarioDTO[]; yo: number }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState<UsuarioDTO | "nuevo" | null>(null);
  const [borrar, setBorrar] = useState<UsuarioDTO | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const actual = edit && edit !== "nuevo" ? edit : null;

  async function guardar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const body = { nombre: f.get("nombre"), apellido: f.get("apellido"), email: f.get("email"), telefono: f.get("telefono"), password: f.get("password"), rol: f.get("rol"), direccion: f.get("direccion"), cargo: f.get("cargo"), estado: f.get("estado") ?? "ACTIVO" };
    setCargando(true); setErrores({});
    try {
      if (edit === "nuevo") await api("/api/usuarios", { body }); else if (actual) await api(`/api/usuarios/${actual.idUsuario}`, { method: "PUT", body });
      toast("success", edit === "nuevo" ? "Usuario creado" : "Usuario actualizado");
      setEdit(null); router.refresh();
    } catch (e) { if (e instanceof ApiClientError && e.fieldErrors) setErrores(e.fieldErrors); else toast("error", mensajeError(e)); }
    finally { setCargando(false); }
  }
  async function eliminar() {
    if (!borrar) return;
    setCargando(true);
    try { await api(`/api/usuarios/${borrar.idUsuario}`, { method: "DELETE" }); toast("success", "Usuario eliminado"); setBorrar(null); router.refresh(); }
    catch (e) { toast("error", mensajeError(e)); setBorrar(null); } finally { setCargando(false); }
  }

  return (
    <section>
      <Encabezado titulo="Usuarios" sub="Clientes, administradores y diseñadores" accion={<button className="adm-btn-primary" onClick={() => { setErrores({}); setEdit("nuevo"); }}><Icon name="plus" className="w-4 h-4 inline mr-1" />Nuevo usuario</button>} />
      <div className="adm-card p-0 overflow-x-auto">
        {usuarios.length === 0 ? <Vacio texto="No hay usuarios." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de usuarios</caption>
            <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Último acceso</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.idUsuario}>
                  <td className="font-semibold">{u.nombre} {u.apellido ?? ""}{u.idUsuario === yo && <span className="adm-badge adm-badge-purple ml-2">Tú</span>}</td>
                  <td className="text-px-muted">{u.email}</td>
                  <td><span className={`adm-badge ${u.roles.includes("ADMINISTRADOR") ? "adm-badge-purple" : "adm-badge-cyan"}`}>{u.roles.join(", ")}</span></td>
                  <td><span className={`adm-badge ${u.estado === "ACTIVO" ? "adm-badge-green" : "adm-badge-danger"}`}>{u.estado === "ACTIVO" ? "Activo" : "Bloqueado"}</span></td>
                  <td className="text-px-muted font-mono text-xs">{u.ultimoLogin ? u.ultimoLogin.slice(0, 16).replace("T", " ") : "—"}</td>
                  <td className="text-right whitespace-nowrap">
                    <button className="adm-btn-icon" aria-label={`Editar ${u.nombre}`} onClick={() => { setErrores({}); setEdit(u); }}><Icon name="pencil" className="w-4 h-4" /></button>
                    <button className="adm-btn-icon" aria-label={`Eliminar ${u.nombre}`} disabled={u.idUsuario === yo} onClick={() => setBorrar(u)}><Icon name="trash-2" className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {edit && (
        <Modal titulo={edit === "nuevo" ? "Nuevo usuario" : "Editar usuario"} onCerrar={() => setEdit(null)} ancho="max-w-xl">
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <Campo id="us-nombre" label="Nombres" error={errores.nombre}><input id="us-nombre" name="nombre" className="adm-field-input" defaultValue={actual?.nombre ?? ""} /></Campo>
            <Campo id="us-apellido" label="Apellidos" error={errores.apellido}><input id="us-apellido" name="apellido" className="adm-field-input" defaultValue={actual?.apellido ?? ""} /></Campo>
            <div className="md:col-span-2"><Campo id="us-email" label="Correo electrónico" error={errores.email}><input id="us-email" name="email" type="email" className="adm-field-input" defaultValue={actual?.email ?? ""} disabled={!!actual} /></Campo></div>
            <Campo id="us-tel" label="Teléfono" error={errores.telefono}><input id="us-tel" name="telefono" className="adm-field-input" defaultValue={actual?.telefono ?? ""} /></Campo>
            <Campo id="us-pass" label={actual ? "Nueva contraseña (opcional)" : "Contraseña"} error={errores.password}><input id="us-pass" name="password" type="password" autoComplete="new-password" className="adm-field-input" /></Campo>
            {!actual && (
              <>
                <Campo id="us-rol" label="Rol" error={errores.rol}><select id="us-rol" name="rol" className="adm-field-select" defaultValue="CLIENTE"><option value="CLIENTE">Cliente</option><option value="ADMINISTRADOR">Administrador</option><option value="DISENADOR">Diseñador</option></select></Campo>
                <Campo id="us-cargo" label="Cargo (administradores)"><input id="us-cargo" name="cargo" className="adm-field-input" /></Campo>
                <div className="md:col-span-2"><Campo id="us-dir" label="Dirección (clientes)"><input id="us-dir" name="direccion" className="adm-field-input" /></Campo></div>
              </>
            )}
            {actual && <Campo id="us-estado" label="Estado"><select id="us-estado" name="estado" className="adm-field-select" defaultValue={actual.estado}><option value="ACTIVO">Activo</option><option value="BLOQUEADO">Bloqueado</option></select></Campo>}
            <div className="md:col-span-2 flex justify-end gap-3 mt-2"><button type="button" className="adm-btn-secondary" onClick={() => setEdit(null)}>Cancelar</button><button className="adm-btn-primary" disabled={cargando}>{cargando ? "Guardando…" : "Guardar"}</button></div>
          </form>
        </Modal>
      )}
      {borrar && <Confirmar titulo="Eliminar usuario" mensaje={`¿Eliminar a ${borrar.nombre} ${borrar.apellido ?? ""}? Si tiene pedidos no podrá eliminarse; bloquéalo en su lugar.`} onSi={eliminar} onNo={() => setBorrar(null)} cargando={cargando} />}
    </section>
  );
}

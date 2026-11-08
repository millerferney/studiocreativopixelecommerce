"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { calcularTotales, type Totales } from "@/lib/money";

/* ───────────── Tipos compartidos ───────────── */
export interface SesionUsuario {
  idUsuario: number;
  nombre: string;
  apellido: string | null;
  email: string;
  roles: string[];
}

export interface CartItem {
  idServicio: number;
  nombre: string;
  precio: number;
  imagenUrl: string | null;
  cantidad: number;
  talla: string | null;
  material: string | null;
  colorHex: string | null;
  estilo: string | null;
  archivoDiseno: string | null; // ruta en Storage
  archivoNombre?: string | null; // solo para mostrar
  notas: string | null;
}

export const MAX_UNIDADES = 10;
export const claveItem = (i: Pick<CartItem, "idServicio" | "talla" | "material" | "colorHex" | "estilo" | "archivoDiseno">) =>
  [i.idServicio, i.talla ?? "", i.material ?? "", i.colorHex ?? "", i.estilo ?? "", i.archivoDiseno ?? ""].join("|");

/* ───────────── Toasts ───────────── */
type TipoToast = "success" | "error" | "info";
interface ToastData { id: number; tipo: TipoToast; mensaje: string; saliendo?: boolean }

/* ───────────── Contextos ───────────── */
interface AuthCtx {
  user: SesionUsuario | null;
  esAdmin: boolean;
  authAbierto: boolean;
  authTab: "login" | "register";
  abrirAuth: (tab?: "login" | "register") => void;
  cerrarAuth: () => void;
  iniciarSesion: (email: string, password: string, rol: "CLIENTE" | "ADMINISTRADOR") => Promise<SesionUsuario>;
  registrar: (datos: Record<string, unknown>) => Promise<SesionUsuario>;
  cerrarSesion: () => Promise<void>;
}
interface CartCtx {
  items: CartItem[];
  cantidadTotal: number;
  totales: Totales;
  ivaPct: number;
  descPct: number;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (item: Omit<CartItem, "cantidad"> & { cantidad?: number }, abrirDrawer?: boolean) => void;
  cambiarCantidad: (clave: string, delta: number) => void;
  quitar: (clave: string) => void;
  vaciar: () => void;
}
const AuthContext = createContext<AuthCtx | null>(null);
const CartContext = createContext<CartCtx | null>(null);
const ToastContext = createContext<(tipo: TipoToast, mensaje: string) => void>(() => {});

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth fuera de <AppProviders>");
  return c;
};
export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart fuera de <AppProviders>");
  return c;
};
export const useToast = () => useContext(ToastContext);

const CART_KEY = "scp_cart_v2";

export function AppProviders({
  children,
  usuarioInicial,
  ivaPct,
  descPct,
}: {
  children: ReactNode;
  usuarioInicial: SesionUsuario | null;
  ivaPct: number;
  descPct: number;
}) {
  const router = useRouter();

  /* ── Toasts ── */
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const seq = useRef(0);
  const toast = useCallback((tipo: TipoToast, mensaje: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tipo, mensaje }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, saliendo: true } : x))), 3500);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3900);
  }, []);

  /* ── Carrito ── */
  const [items, setItems] = useState<CartItem[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  const [user, setUser] = useState<SesionUsuario | null>(usuarioInicial);
  const esCliente = !!user?.roles.includes("CLIENTE");

  // Hidratación desde localStorage (solo en el navegador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* almacenamiento corrupto o bloqueado: se ignora */
    }
    setHidratado(true);
  }, []);

  // Persistencia local + sincronización con la BD (debounce) para clientes con sesión
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const omitirSync = useRef(false);
  useEffect(() => {
    if (!hidratado) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignora */
    }
    if (!esCliente) return;
    if (omitirSync.current) {
      omitirSync.current = false;
      return;
    }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      api("/api/carrito", { method: "PUT", body: { items: items.map(({ nombre: _n, precio: _p, imagenUrl: _i, archivoNombre: _a, ...r }) => r) } }).catch(() => {});
    }, 700);
  }, [items, hidratado, esCliente]);

  const agregar: CartCtx["agregar"] = useCallback(
    (nuevo, abrirDrawer = true) => {
      const cantidad = nuevo.cantidad ?? 1;
      setItems((prev) => {
        const k = claveItem(nuevo);
        const idx = prev.findIndex((p) => claveItem(p) === k);
        if (idx >= 0) {
          const total = prev[idx].cantidad + cantidad;
          if (total > MAX_UNIDADES) toast("info", `Límite máximo de ${MAX_UNIDADES} unidades por producto alcanzado.`);
          return prev.map((p, i) => (i === idx ? { ...p, cantidad: Math.min(MAX_UNIDADES, total) } : p));
        }
        return [...prev, { ...nuevo, cantidad: Math.min(cantidad, MAX_UNIDADES) }];
      });
      if (abrirDrawer) setAbierto(true);
    },
    [toast],
  );
  const cambiarCantidad = useCallback(
    (clave: string, delta: number) => {
      setItems((prev) =>
        prev
          .map((p) => {
            if (claveItem(p) !== clave) return p;
            const n = p.cantidad + delta;
            if (n > MAX_UNIDADES) toast("info", `Límite máximo de ${MAX_UNIDADES} unidades por producto alcanzado.`);
            return { ...p, cantidad: Math.min(MAX_UNIDADES, n) };
          })
          .filter((p) => p.cantidad > 0),
      );
    },
    [toast],
  );
  const quitar = useCallback((clave: string) => setItems((prev) => prev.filter((p) => claveItem(p) !== clave)), []);
  const vaciar = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totales = useMemo(() => calcularTotales(subtotal, ivaPct, descPct), [subtotal, ivaPct, descPct]);
  const cantidadTotal = items.reduce((n, i) => n + i.cantidad, 0);

  /* ── Sesión ── */
  const [authAbierto, setAuthAbierto] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const abrirAuth = useCallback((tab: "login" | "register" = "login") => {
    setAuthTab(tab);
    setAuthAbierto(true);
  }, []);
  const cerrarAuth = useCallback(() => setAuthAbierto(false), []);

  const aSesion = (u: Record<string, unknown>): SesionUsuario => ({
    idUsuario: u.idUsuario as number,
    nombre: u.nombre as string,
    apellido: (u.apellido as string | null) ?? null,
    email: u.email as string,
    roles: u.roles as string[],
  });

  /** Al iniciar sesión se unen el carrito del navegador y el guardado en la BD. */
  const fusionarCarrito = useCallback(async (locales: CartItem[]) => {
    try {
      const r = await api<{ items: CartItem[] }>("/api/carrito/fusionar", {
        method: "POST",
        body: { items: locales.map(({ nombre: _n, precio: _p, imagenUrl: _i, archivoNombre: _a, ...x }) => x) },
      });
      omitirSync.current = true;
      setItems(r.items.map((i) => ({ ...i, archivoNombre: i.archivoDiseno ? i.archivoDiseno.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") ?? null : null })));
    } catch {
      /* si falla, queda el carrito local */
    }
  }, []);

  const iniciarSesion: AuthCtx["iniciarSesion"] = useCallback(
    async (email, password, rol) => {
      const u = aSesion(await api("/api/auth/login", { body: { email, password, rol } }));
      setUser(u);
      if (u.roles.includes("CLIENTE")) await fusionarCarrito(items);
      router.refresh();
      return u;
    },
    [items, fusionarCarrito, router],
  );
  const registrar: AuthCtx["registrar"] = useCallback(
    async (datos) => {
      const u = aSesion(await api("/api/auth/registro", { body: datos }));
      setUser(u);
      await fusionarCarrito(items);
      router.refresh();
      return u;
    },
    [items, fusionarCarrito, router],
  );
  const cerrarSesion = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setItems([]); // evita dejar el carrito de un cliente en un equipo compartido
    router.push("/");
    router.refresh();
  }, [router]);

  const auth = useMemo<AuthCtx>(
    () => ({ user, esAdmin: !!user?.roles.includes("ADMINISTRADOR"), authAbierto, authTab, abrirAuth, cerrarAuth, iniciarSesion, registrar, cerrarSesion }),
    [user, authAbierto, authTab, abrirAuth, cerrarAuth, iniciarSesion, registrar, cerrarSesion],
  );
  const cart = useMemo<CartCtx>(
    () => ({ items, cantidadTotal, totales, ivaPct, descPct, abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false), agregar, cambiarCantidad, quitar, vaciar }),
    [items, cantidadTotal, totales, ivaPct, descPct, abierto, agregar, cambiarCantidad, quitar, vaciar],
  );

  const iconos = { success: "✓", error: "✕", info: "i" } as const;
  return (
    <AuthContext.Provider value={auth}>
      <CartContext.Provider value={cart}>
        <ToastContext.Provider value={toast}>
          {children}
          <div id="toast-container" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={`toast-item toast-${t.tipo} toast-in${t.saliendo ? " toast-out" : ""}`} style={{ position: "relative" }}>
                <div className="toast-icon">{iconos[t.tipo]}</div>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{t.mensaje}</span>
                <button
                  onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                  aria-label="Cerrar notificación"
                  style={{ background: "none", border: "none", color: "rgb(var(--c-dim2))", cursor: "pointer", padding: 4, lineHeight: 1, fontSize: 16, flexShrink: 0 }}
                >
                  &times;
                </button>
                <div className="toast-bar" />
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}

export function mensajeError(e: unknown, porDefecto = "Ocurrió un error inesperado."): string {
  return e instanceof ApiClientError ? e.message : porDefecto;
}

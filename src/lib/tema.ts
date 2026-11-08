/** Utilidades de color para estilos en línea basados en las variables de tema (ver globals.css). */

/** conAlfa("rgb(var(--c-cyan))", 0.13) → "rgb(var(--c-cyan) / 0.13)". Reemplaza al truco de sufijos hex (#00E5FF22). */
export const conAlfa = (color: string, alfa: number) => color.replace(/^rgb\((var\(--c-[\w]+\))\)$/, `rgb($1 / ${alfa})`);

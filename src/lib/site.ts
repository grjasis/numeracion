/**
 * Origen público del sitio, usado para las URLs absolutas del sitemap, del
 * robots.txt y de los metadatos.
 *
 * Se puede sobrescribir con `NEXT_PUBLIC_SITE_URL` (por ejemplo, para levantar
 * una copia en otro dominio). Nunca lleva barra final.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://numeracion.code.ar"
).replace(/\/$/, "");

/** Construye una URL absoluta a partir de una ruta del sitio (`/areas`). */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

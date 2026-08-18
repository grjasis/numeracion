import type { MetadataRoute } from "next";

import { loadDataset } from "@/lib/dataset/load";
import { getAreaCodes, getOperators } from "@/lib/dataset/queries";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap para los buscadores.
 *
 * Todas las páginas salen del mismo dataset, así que comparten la fecha de la
 * última ingesta como `lastModified`: cuando se actualiza la base de Enacom se
 * regenera el sitio entero y el sitemap avisa que todo cambió.
 */

/** Rutas fijas del sitio, con su prioridad relativa. */
const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/consultar", priority: 0.9 },
  { path: "/areas", priority: 0.9 },
  { path: "/operadores", priority: 0.8 },
  { path: "/asignaciones", priority: 0.8 },
  { path: "/particularidades", priority: 0.7 },
  { path: "/plan", priority: 0.6 },
  { path: "/metodologia", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const { meta } = loadDataset();
  const lastModified = new Date(meta.generatedAt);

  return [
    ...STATIC_ROUTES.map(({ path, priority }) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority,
    })),
    ...getAreaCodes().map((area) => ({
      url: absoluteUrl(`/areas/${area.areaCode}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getOperators().map((operator) => ({
      url: absoluteUrl(`/operadores/${operator.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

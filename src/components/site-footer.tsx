import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { DatasetMeta } from "@/lib/dataset/types";

/** Pie de página con la procedencia del dato. */
export function SiteFooter({ meta }: { meta: DatasetMeta }) {
  return (
    <footer className="mt-16 border-t border-hairline bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-ink-secondary sm:px-6">
        <p>
          Fuente: base de numeración geográfica publicada por el{" "}
          <a
            href="https://www.enacom.gob.ar"
            className="underline underline-offset-2 hover:text-ink"
          >
            Ente Nacional de Comunicaciones (Enacom)
          </a>
          . Archivo <span className="font-mono">{meta.sourceFile}</span>, con
          resoluciones hasta el {formatDate(meta.latestResolutionDate)}. Sitio
          informativo sin vínculo con Enacom. Los datos se procesan según el Plan
          Fundamental de Numeración Nacional; ver{" "}
          <Link href="/metodologia" className="underline underline-offset-2 hover:text-ink">
            metodología
          </Link>
          . Contacto: Gustavo Riveros{" "}
          <a
            href="mailto:grjasis@code.ar"
            className="underline underline-offset-2 hover:text-ink"
          >
            &lt;grjasis@code.ar&gt;
          </a>
        </p>
      </div>
    </footer>
  );
}

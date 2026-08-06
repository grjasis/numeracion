import Link from "next/link";

const LINKS = [
  { href: "/", label: "Panorama" },
  { href: "/consultar", label: "Consultar un número" },
  { href: "/areas", label: "Códigos de área" },
  { href: "/operadores", label: "Operadores" },
  { href: "/asignaciones", label: "Asignaciones" },
  { href: "/particularidades", label: "Particularidades" },
  { href: "/plan", label: "Plan de numeración" },
  { href: "/metodologia", label: "Metodología" },
];

/** Barra de navegación del tablero. */
export function SiteHeader() {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Numeración geográfica argentina
        </Link>
        <nav aria-label="Secciones">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-secondary">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

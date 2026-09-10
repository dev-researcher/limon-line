import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { SALON } from "../data/salon";

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/#galeria", label: "Galería" },
  { to: "/#servicios", label: "Servicios" },
  { to: "/#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/90 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link to="/" className="group min-w-0 shrink" onClick={() => setOpen(false)}>
          <span className="block truncate font-display text-xl font-semibold tracking-tight text-ink transition group-hover:text-rose-deep sm:text-2xl lg:text-3xl">
            {SALON.name}
          </span>
        </Link>

        <button
          type="button"
          className="shrink-0 rounded-full border border-ink/10 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? "Cerrar" : "Menú"}
        </button>

        {/* Desktop */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) =>
            link.to.includes("#") ? (
              <a
                key={link.to}
                href={link.to}
                className="text-sm font-medium text-ink/70 transition hover:text-rose-deep"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${
                    isActive ? "text-rose-deep" : "text-ink/70 hover:text-rose-deep"
                  }`
                }
              >
                {link.label}
              </NavLink>
            )
          )}
          <Link to="/reservar" className="btn-primary">
            Agendar cita
          </Link>
        </nav>
      </div>

      {/* Mobile panel */}
      {open && (
        <nav className="border-t border-ink/5 bg-cream px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) =>
              link.to.includes("#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-ink/70 transition hover:text-rose-deep"
                >
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-2 py-3 text-sm font-medium transition ${
                      isActive ? "text-rose-deep" : "text-ink/70 hover:text-rose-deep"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
            <Link
              to="/reservar"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full"
            >
              Agendar cita
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { SALON } from "../data/salon";

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/#galeria", label: "Galería" },
  { to: "/#servicios", label: "Servicios" },
  { to: "/#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="group">
          <span className="font-display text-2xl font-semibold tracking-tight text-ink transition group-hover:text-rose-deep sm:text-3xl">
            {SALON.name}
          </span>
        </Link>

        <button
          type="button"
          className="rounded-full border border-ink/10 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? "Cerrar" : "Menú"}
        </button>

        <nav
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full flex-col gap-1 border-b border-ink/5 bg-cream/95 p-4 lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:p-0`}
        >
          {links.map((link) =>
            link.to.includes("#") ? (
              <a
                key={link.to}
                href={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-ink/70 transition hover:text-rose-deep"
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
                  `rounded-lg px-2 py-2 text-sm font-medium transition ${
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
            className="btn-primary mt-2 lg:mt-0"
          >
            Agendar cita
          </Link>
        </nav>
      </div>
    </header>
  );
}

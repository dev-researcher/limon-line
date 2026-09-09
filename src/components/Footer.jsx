import { Link } from "react-router-dom";
import { SALON } from "../data/salon";

export default function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-ink text-champagne">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-3xl font-semibold">{SALON.name}</p>
          <p className="mt-3 max-w-xs text-sm text-champagne/70">{SALON.tagline}</p>
        </div>

        <div className="space-y-2 text-sm text-champagne/80">
          <p className="font-semibold text-champagne">Visítanos</p>
          <p>{SALON.direction}</p>
          <p>{SALON.schedule}</p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold text-champagne">Contacto</p>
          <a
            href={`https://wa.me/${SALON.whatsappRaw}`}
            className="block text-champagne/80 transition hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp {SALON.whatsapp}
          </a>
          <a
            href={SALON.instagram}
            className="block text-champagne/80 transition hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Instagram @aa_glamstudio
          </a>
          <Link to="/login" className="block text-champagne/40 transition hover:text-champagne/70">
            Acceso administración
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-champagne/40">
        © {new Date().getFullYear()} {SALON.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}

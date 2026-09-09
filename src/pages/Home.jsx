import { Link } from "react-router-dom";
import { GALLERY, SALON, formatDuration } from "../data/salon";

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center animate-soft-in"
          style={{ backgroundImage: `url(${SALON.heroImage})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/88 via-ink/60 to-ink/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(196,91,122,0.32),transparent_45%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:justify-center lg:px-8 lg:pb-24">
          <p className="animate-fade-up font-display text-5xl font-semibold leading-none text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {SALON.name}
          </p>
          <h1 className="animate-fade-up-delay mt-5 max-w-xl font-display text-2xl italic text-rose-soft sm:text-3xl md:text-4xl">
            Belleza con estilo en el corazón de Limón
          </h1>
          <p className="animate-fade-up-late mt-4 max-w-lg text-base text-white/80 sm:text-lg">
            Cortes, tratamientos y peinados con atención personalizada. Agenda tu cita en minutos.
          </p>
          <div className="animate-fade-up-late mt-8 flex flex-wrap gap-3">
            <Link to="/reservar" className="btn-primary">
              Reservar ahora
            </Link>
            <a
              href="#galeria"
              className="btn-secondary border-white/30 bg-white/10 text-white hover:border-white hover:text-white"
            >
              Ver trabajos
            </a>
          </div>
        </div>
      </section>

      {/* SOBRE EL SALÓN */}
      <section className="section-pad" id="nosotros">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Nuestro espacio
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
              Un espacio para realzar tu esencia
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink/70 md:text-lg">
              {SALON.description}
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {SALON.categories.map((cat) => (
                <li
                  key={cat}
                  className="rounded-full border border-rose/20 bg-rose-mist/60 px-3 py-1 text-xs font-medium text-rose-deep"
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-rose-soft/40 to-champagne/60 blur-sm" />
            <img
              src={SALON.image}
              alt={`Interior de ${SALON.name}`}
              className="relative aspect-square w-full rounded-[1.75rem] object-cover shadow-xl"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="border-y border-ink/5 bg-white/40">
        <div className="section-pad">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Galería
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
              Trabajos que hablan por sí solos
            </h2>
            <p className="mt-4 text-ink/65">
              Imágenes de muestra del estilo y la atención que encuentras en el salón.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {GALLERY.map((item, index) => (
              <figure
                key={item.caption}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-ink/5"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                  width={1200}
                  height={1200}
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent px-4 pb-4 pt-16">
                  <span className="font-display text-lg font-semibold text-white md:text-xl">
                    {item.caption}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="bg-white/50">
        <div className="section-pad">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
              Menú de belleza
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
              Servicios
            </h2>
            <p className="mt-4 text-ink/65">
              Elige el tratamiento ideal y reserva con adelanto por SINPE móvil.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {SALON.services.map((service) => (
              <Link
                key={service.name}
                to={`/reservar?servicio=${encodeURIComponent(service.name)}`}
                className="group flex items-start justify-between gap-4 border-b border-ink/10 py-5 transition hover:border-rose/30"
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink transition group-hover:text-rose-deep">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">
                    {service.description}
                  </p>
                </div>
                <span className="shrink-0 pt-1 text-xs font-medium text-ink/40">
                  {formatDuration(service.duration)}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/reservar" className="btn-primary">
              Quiero reservar
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="section-pad">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-champagne sm:px-10 lg:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: `url(${GALLERY[4].src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-ink/85" aria-hidden />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-soft">
                Contacto
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-white md:text-5xl">
                Te esperamos en Limón
              </h2>
              <p className="mt-4 max-w-md text-champagne/70">
                Escríbenos por WhatsApp o reserva en línea. Confirmamos tu cita al verificar el comprobante SINPE.
              </p>
            </div>
            <div className="space-y-4 text-sm sm:text-base">
              <p>
                <span className="text-champagne/50">Dirección</span>
                <br />
                {SALON.direction}
              </p>
              <p>
                <span className="text-champagne/50">Horario</span>
                <br />
                {SALON.schedule}
              </p>
              <p>
                <span className="text-champagne/50">WhatsApp</span>
                <br />
                <a
                  href={`https://wa.me/${SALON.whatsappRaw}`}
                  className="underline decoration-rose/50 underline-offset-4 hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {SALON.whatsapp}
                </a>
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/reservar" className="btn-primary">
                  Agendar cita
                </Link>
                <a
                  href={SALON.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary border-white/20 bg-transparent text-white hover:border-white hover:text-white"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SALON, formatColon, formatDuration } from "../data/salon";
import { getAvailableHours, minBookingDate } from "../services/schedule";
import {
  attachProof,
  createReservation,
  getReservationsByDate,
} from "../services/reservations";
import { uploadProof } from "../services/uploadProof";

const STEPS = ["Servicio", "Fecha y hora", "Tus datos", "Pago SINPE"];

export default function Reservar() {
  const [step, setStep] = useState(0);
  const [serviceName, setServiceName] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const selectedService = useMemo(
    () => SALON.services.find((s) => s.name === serviceName) || null,
    [serviceName]
  );

  const availableHours = useMemo(
    () => getAvailableHours(date, selectedService, reservations),
    [date, selectedService, reservations]
  );

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    (async () => {
      setLoadingHours(true);
      setHour("");
      try {
        const rows = await getReservationsByDate(date);
        if (!cancelled) setReservations(rows);
      } catch {
        if (!cancelled) setError("No se pudieron cargar las horas. Intenta de nuevo.");
      } finally {
        if (!cancelled) setLoadingHours(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const whatsappLink = `https://wa.me/${SALON.whatsappRaw}?text=${encodeURIComponent(
    `Hola! Reservaré en ${SALON.name} a nombre de ${name}. Servicio: ${serviceName}. Fecha: ${date} a las ${hour}. Ya envié el comprobante SINPE de ${formatColon(SALON.deposit)}.`
  )}`;

  const goNext = () => {
    setError("");
    if (step === 0 && !selectedService) {
      setError("Selecciona un servicio para continuar.");
      return;
    }
    if (step === 1 && (!date || !hour)) {
      setError("Elige fecha y hora disponibles.");
      return;
    }
    if (step === 2 && (!name.trim() || !phone.trim())) {
      setError("Completa tu nombre y teléfono.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!proofFile) {
      setError("Sube el comprobante del SINPE para confirmar tu reserva.");
      return;
    }

    setSubmitting(true);
    try {
      const reservationId = await createReservation({
        customerName: name.trim(),
        name: name.trim(),
        phone: phone.trim(),
        date,
        hour,
        time: hour,
        service: selectedService.name,
        duration: selectedService.duration,
      });

      const proofUrl = await uploadProof(proofFile, reservationId);
      await attachProof(reservationId, proofUrl);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar la reserva. Revisa tu conexión e intenta otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="section-pad max-w-xl">
        <div className="animate-fade-up rounded-[2rem] border border-rose/20 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <p className="font-display text-4xl font-semibold text-ink">¡Reserva enviada!</p>
          <p className="mt-4 text-ink/70">
            Recibimos tu solicitud y el comprobante. Te confirmamos cuando verifiquemos el pago SINPE.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary">
              Confirmar por WhatsApp
            </a>
            <Link to="/" className="btn-secondary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-pad max-w-3xl">
      <div className="animate-soft-in text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose">
          Reserva en línea
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
          Agenda tu cita
        </h1>
        <p className="mt-3 text-ink/65">
          Adelanto de {formatColon(SALON.deposit)} por SINPE móvil para confirmar tu espacio.
        </p>
      </div>

      <ol className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              i === step
                ? "bg-rose text-white"
                : i < step
                  ? "bg-rose-mist text-rose-deep"
                  : "bg-white/70 text-ink/40"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-[2rem] border border-ink/5 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8"
      >
        {step === 0 && (
          <div className="space-y-3 animate-fade-up">
            <label className="label">Servicio</label>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {SALON.services.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setServiceName(s.name)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    serviceName === s.name
                      ? "border-rose bg-rose-mist/70"
                      : "border-ink/10 hover:border-rose/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-ink">{s.name}</span>
                    <span className="text-xs text-ink/45">{formatDuration(s.duration)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            <p className="rounded-2xl bg-rose-mist/50 px-4 py-3 text-sm text-ink/70">
              Servicio: <strong>{selectedService?.name}</strong> · {formatDuration(selectedService?.duration || 0)}
            </p>
            <div>
              <label className="label" htmlFor="date">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                min={minBookingDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="hour">
                Hora disponible
              </label>
              {loadingHours ? (
                <p className="text-sm text-ink/50">Buscando horarios…</p>
              ) : (
                <select
                  id="hour"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="field"
                  required
                >
                  <option value="">Selecciona una hora</option>
                  <optgroup label="Mañana">
                    {availableHours
                      .filter((h) => parseInt(h.split(":")[0], 10) < 12)
                      .map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Tarde">
                    {availableHours
                      .filter((h) => parseInt(h.split(":")[0], 10) >= 12)
                      .map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                  </optgroup>
                </select>
              )}
              {date && !loadingHours && availableHours.length === 0 && (
                <p className="mt-2 text-sm text-rose-deep">
                  No hay horas disponibles para esta fecha. Prueba otro día.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <label className="label" htmlFor="name">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Teléfono / WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field"
                placeholder="8888-8888"
                required
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fade-up">
            <div className="rounded-2xl border border-rose/20 bg-rose-mist/40 p-4 text-sm leading-relaxed text-ink/80">
              <p className="font-semibold text-ink">Instrucciones de pago</p>
              <p className="mt-2">
                Transfiere <strong>{formatColon(SALON.deposit)}</strong> por SINPE móvil al número{" "}
                <strong>{SALON.sinpePhone}</strong> a nombre de <strong>{SALON.sinpeName}</strong>.
              </p>
              <p className="mt-2">
                En el detalle escribe tu nombre: <strong>{name || "tu nombre"}</strong>.
              </p>
              <p className="mt-3 text-ink/60">
                {selectedService?.name} · {date} · {hour}
              </p>
            </div>

            <div>
              <label className="label" htmlFor="proof">
                Comprobante SINPE (imagen)
              </label>
              <input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-rose file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                required
              />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-rose/30 bg-rose-mist/50 px-4 py-3 text-sm text-rose-deep">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
              className="btn-secondary"
            >
              Atrás
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              Continuar
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? "Enviando…" : "Confirmar reserva"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

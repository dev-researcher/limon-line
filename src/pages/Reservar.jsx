import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("servicio") || "";
  const initialService = SALON.services.some((s) => s.name === preselected)
    ? preselected
    : "";
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [serviceName, setServiceName] = useState(initialService);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [hoursReady, setHoursReady] = useState(false);
  const [hoursLoadFailed, setHoursLoadFailed] = useState(false);
  const [hoursRetryKey, setHoursRetryKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const selectedService = useMemo(
    () => SALON.services.find((s) => s.name === serviceName) || null,
    [serviceName]
  );

  const hasProof = Boolean(proofFile);

  const availableHours = useMemo(
    () =>
      hoursReady && !hoursLoadFailed
        ? getAvailableHours(date, selectedService, reservations)
        : [],
    [date, selectedService, reservations, hoursReady, hoursLoadFailed]
  );

  useEffect(() => {
    if (!date) {
      setReservations([]);
      setHoursReady(false);
      setHoursLoadFailed(false);
      setLoadingHours(false);
      return;
    }

    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 2;

    const loadHours = async () => {
      setLoadingHours(true);
      setHoursReady(false);
      setHoursLoadFailed(false);
      setHour("");
      setError("");

      while (attempt < maxAttempts && !cancelled) {
        attempt += 1;
        try {
          const rows = await getReservationsByDate(date);
          if (cancelled) return;
          setReservations(rows);
          setHoursReady(true);
          setHoursLoadFailed(false);
          setLoadingHours(false);
          return;
        } catch (err) {
          console.error("Error cargando horas:", err);
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      if (!cancelled) {
        setReservations([]);
        setHoursReady(false);
        setHoursLoadFailed(true);
        setLoadingHours(false);
        setError(
          "No se pudieron cargar las horas. Revisa tu conexión y pulsa «Reintentar»."
        );
      }
    };

    loadHours();
    return () => {
      cancelled = true;
    };
  }, [date, hoursRetryKey]);

  const bookingWhatsAppMessage = useMemo(() => {
    const proofLine = hasProof
      ? "Comprobante SINPE: Sí, adjunté imagen en el sitio"
      : "Comprobante SINPE: No adjunté comprobante";
    return [
      `Hola! Quiero reservar en ${SALON.name}.`,
      "",
      `Nombre: ${name.trim() || "—"}`,
      `Teléfono: ${phone.trim() || "—"}`,
      `Tratamiento: ${serviceName || "—"}`,
      `Fecha: ${date || "—"}`,
      `Hora: ${hour || "—"}`,
      `Adelanto SINPE: ${formatColon(SALON.deposit)}`,
      proofLine,
      "",
      "No pude completar la reserva en el sitio web. ¿Me ayudan a confirmar la cita?",
    ].join("\n");
  }, [name, phone, serviceName, date, hour, hasProof]);

  const whatsappFallbackLink = `https://wa.me/${SALON.whatsappRaw}?text=${encodeURIComponent(
    bookingWhatsAppMessage
  )}`;

  const whatsappConfirmLink = `https://wa.me/${SALON.whatsappRaw}?text=${encodeURIComponent(
    `Hola! Reservaré en ${SALON.name} a nombre de ${name}. Servicio: ${serviceName}. Fecha: ${date} a las ${hour}. Adelanto SINPE de ${formatColon(SALON.deposit)}.`
  )}`;

  const goNext = () => {
    setError("");
    setSubmitFailed(false);
    if (step === 0 && !selectedService) {
      setError("Selecciona un servicio para continuar.");
      return;
    }
    if (step === 1) {
      if (!date) {
        setError("Primero elige la fecha. Luego podrás ver las horas disponibles.");
        return;
      }
      if (loadingHours) {
        setError("Espera a que terminen de cargar las horas disponibles.");
        return;
      }
      if (hoursLoadFailed || !hoursReady) {
        setError(
          "No se pudieron cargar las horas. Pulsa «Reintentar» antes de continuar."
        );
        return;
      }
      if (availableHours.length === 0) {
        setError("No hay horas disponibles para esta fecha. Elige otro día.");
        return;
      }
      if (!hour) {
        setError("Selecciona una hora disponible para continuar.");
        return;
      }
      if (!availableHours.includes(hour)) {
        setError("La hora elegida ya no está disponible. Selecciona otra.");
        return;
      }
    }
    if (step === 2 && (!name.trim() || !phone.trim())) {
      setError("Completa tu nombre y teléfono.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitFailed) return;
    setError("");
    setSubmitFailed(false);

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

      if (proofFile) {
        const proofUrl = await uploadProof(proofFile, reservationId);
        await attachProof(reservationId, proofUrl);
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitFailed(true);
      setError(
        "Hubo un problema al guardar la reserva. Completa tu cita por WhatsApp con el mensaje ya listo."
      );
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
            Recibimos tu solicitud. Te confirmamos cuando verifiquemos el pago SINPE.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={whatsappConfirmLink} target="_blank" rel="noreferrer" className="btn-primary">
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
            <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {SALON.services.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setServiceName(s.name)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition ${
                    serviceName === s.name
                      ? "border-rose bg-rose-mist/70"
                      : "border-ink/10 hover:border-rose/40"
                  }`}
                >
                  <img
                    src={s.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className="shrink-0 text-xs text-ink/45">
                        {formatDuration(s.duration)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-ink/60">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-3 rounded-2xl bg-rose-mist/50 p-3 text-sm text-ink/70">
              {selectedService?.image && (
                <img
                  src={selectedService.image}
                  alt=""
                  className="h-14 w-14 rounded-xl object-cover"
                  width={56}
                  height={56}
                />
              )}
              <p>
                Servicio: <strong>{selectedService?.name}</strong> ·{" "}
                {formatDuration(selectedService?.duration || 0)}
              </p>
            </div>
            <div>
              <label className="label" htmlFor="date">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                min={minBookingDate()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setHour("");
                  setHoursReady(false);
                  setHoursLoadFailed(false);
                  setError("");
                }}
                className="field"
                required
              />
              <p className="mt-1.5 text-xs text-ink/50">
                Primero selecciona la fecha para cargar las horas libres.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="hour">
                Hora disponible
              </label>
              {!date ? (
                <p className="rounded-2xl border border-rose/20 bg-rose-mist/40 px-4 py-3 text-sm text-rose-deep">
                  Elige primero la fecha. Después aparecerán las horas disponibles.
                </p>
              ) : loadingHours ? (
                <p className="text-sm text-ink/50">Buscando horarios…</p>
              ) : hoursLoadFailed ? (
                <div className="space-y-3 rounded-2xl border border-rose/30 bg-rose-mist/50 px-4 py-3">
                  <p className="text-sm text-rose-deep">
                    No se pudieron cargar las horas. Revisa tu conexión e intenta de nuevo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setHoursRetryKey((k) => k + 1);
                    }}
                    className="btn-secondary"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <select
                  id="hour"
                  value={hour}
                  onChange={(e) => {
                    setHour(e.target.value);
                    setError("");
                  }}
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
              {date && !loadingHours && hoursReady && !hoursLoadFailed && availableHours.length === 0 && (
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
                Imagen del comprobante (opcional)
              </label>
              <input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setProofFile(e.target.files?.[0] || null);
                  setSubmitFailed(false);
                  setError("");
                }}
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-rose file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
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
                setSubmitFailed(false);
                setStep((s) => s - 1);
              }}
              className="btn-secondary"
            >
              Atrás
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 1 && (loadingHours || hoursLoadFailed)}
              className="btn-primary disabled:opacity-60"
            >
              Continuar
            </button>
          ) : submitFailed ? (
            <a
              href={whatsappFallbackLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Hablar por WhatsApp
            </a>
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

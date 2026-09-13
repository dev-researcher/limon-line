import { useEffect, useMemo, useRef, useState } from "react";
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
  const prevStepRef = useRef(step);
  const confirmReadyRef = useRef(true);
  const [confirmReady, setConfirmReady] = useState(true);

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
        // Mostrar horario aunque no se lean reservas
        setReservations([]);
        setHoursReady(true);
        setHoursLoadFailed(false);
        setLoadingHours(false);
      }
    };

    loadHours();
    return () => {
      cancelled = true;
    };
  }, [date, hoursRetryKey]);

  useEffect(() => {
    const cameToPayment =
      step === STEPS.length - 1 && prevStepRef.current !== step;
    prevStepRef.current = step;
    if (!cameToPayment) return;

    setSubmitFailed(false);
    setError("");
    confirmReadyRef.current = false;
    setConfirmReady(false);
    const t = window.setTimeout(() => {
      confirmReadyRef.current = true;
      setConfirmReady(true);
    }, 450);
    return () => window.clearTimeout(t);
  }, [step]);

  const bookingWhatsAppMessage = useMemo(() => {
    const sinpeLine = hasProof
      ? "Comprobante SINPE: Sí, adjunté imagen en el sitio"
      : "Adelanto SINPE: No di adelanto";

    return [
      `Hola! Quiero reservar en ${SALON.name}.`,
      "",
      `Nombre y apellido: ${name.trim() || "—"}`,
      `Teléfono: ${phone.trim() || "—"}`,
      `Tratamiento: ${serviceName || "—"}`,
      sinpeLine,
      `Fecha: ${date || "—"}`,
      `Hora: ${hour || "—"}`,
      "",
      "No pude completar la reserva en el sitio web. ¿Me ayudan a confirmar la cita?",
    ].join("\n");
  }, [name, phone, serviceName, date, hour, hasProof]);

  const whatsappFallbackLink = `https://wa.me/${SALON.whatsappRaw}?text=${encodeURIComponent(
    bookingWhatsAppMessage
  )}`;

  const whatsappConfirmMessage = useMemo(() => {
    const sinpePart = hasProof
      ? `Adelanto SINPE: sí, adjunté el comprobante (${formatColon(SALON.deposit)}).`
      : "Adelanto SINPE: no di adelanto.";

    return [
      `Hola! Quiero confirmar mi reserva en ${SALON.name}.`,
      `Nombre y apellido: ${name.trim() || "—"}`,
      sinpePart,
      `Servicio: ${serviceName || "—"}`,
      `Fecha: ${date || "—"} a las ${hour || "—"}.`,
    ].join(" ");
  }, [name, serviceName, date, hour, hasProof]);

  const whatsappConfirmLink = `https://wa.me/${SALON.whatsappRaw}?text=${encodeURIComponent(
    whatsappConfirmMessage
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
      setError("Completa tu nombre y apellido, y tu teléfono.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError("");
    setSubmitFailed(false);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectService = (nextName) => {
    setServiceName(nextName);
    setError("");
    window.setTimeout(() => {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 160);
  };

  const handleConfirm = async () => {
    if (step !== STEPS.length - 1) return;
    if (!confirmReadyRef.current || submitting) return;

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
        hasProof: Boolean(proofFile),
      });

      if (proofFile) {
        try {
          const proofUrl = await uploadProof(proofFile, reservationId);
          await attachProof(reservationId, proofUrl);
        } catch (proofErr) {
          console.error("Comprobante no subido:", proofErr);
        }
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitFailed(true);
      const denied =
        err?.code === "permission-denied" ||
        String(err?.message || "").toLowerCase().includes("permission");
      setError(
        denied
          ? "No se pudo guardar la reserva en el servidor (permisos de Firebase). Puedes reintentar o confirmar por WhatsApp."
          : "Hubo un problema al guardar la reserva. Puedes reintentar o confirmar por WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="section-pad max-w-xl">
        <div className="animate-fade-up rounded-[2rem] border border-rose/20 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <p className="font-display text-4xl font-semibold text-ink">
            ¡Reserva enviada!
          </p>
          <p className="mt-4 text-ink/70">
            Recibimos tu solicitud. Te confirmamos cuando verifiquemos el pago
            SINPE.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappConfirmLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
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

  const stepHint =
    step === 0
      ? "Toca un servicio para pasar a fecha y hora."
      : step === 1
        ? "Elige la fecha y luego la hora disponible."
        : step === 2
          ? "Completa tus datos para continuar."
          : "El comprobante es opcional. Confirma cuando estés lista.";

  const primaryDisabled =
    (step === 0 && !selectedService) ||
    (step === 1 && (loadingHours || hoursLoadFailed || !date || !hour)) ||
    (step === 2 && (!name.trim() || !phone.trim())) ||
    (step === STEPS.length - 1 && (submitting || !confirmReady));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
      <div className="animate-soft-in px-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose sm:text-sm">
          Reserva en línea
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Agenda tu cita
        </h1>
        <p className="mt-2 text-sm text-ink/65">
          Adelanto de {formatColon(SALON.deposit)} por SINPE móvil.
        </p>
      </div>

      <ol className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${
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

      <p className="mt-4 text-center text-sm font-medium text-ink/70">{stepHint}</p>

      <div className="mt-4 rounded-3xl border border-ink/5 bg-white/80 p-4 shadow-sm backdrop-blur sm:mt-5 sm:rounded-[2rem] sm:p-6 md:p-8">
        {step === 0 && (
          <div className="animate-fade-up space-y-3">
            <div className="flex items-end justify-between gap-3">
              <label className="label mb-0">¿Qué servicio quieres?</label>
              <span className="text-xs text-ink/40">
                {SALON.services.length} opciones
              </span>
            </div>
            <div className="space-y-2">
              {SALON.services.map((s) => {
                const active = serviceName === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => selectService(s.name)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                      active
                        ? "border-rose bg-rose-mist/70 ring-2 ring-rose/30"
                        : "border-ink/10 hover:border-rose/40"
                    }`}
                  >
                    <img
                      src={s.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
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
                      <p className="mt-0.5 line-clamp-1 text-sm text-ink/60 sm:line-clamp-2">
                        {s.description}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        active ? "bg-rose text-white" : "bg-ink/5 text-ink/25"
                      }`}
                      aria-hidden
                    >
                      {active ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up space-y-4">
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
              <div className="min-w-0">
                <p>
                  Servicio: <strong>{selectedService?.name}</strong>
                </p>
                <p className="text-ink/50">
                  {formatDuration(selectedService?.duration || 0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-ink/55">
              Primero elige la fecha; luego selecciona la hora disponible.
            </p>
            <div>
              <label className="label" htmlFor="date">
                Fecha <span className="text-rose-deep">*</span>
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {[
                  { label: "Hoy", value: minBookingDate() },
                  {
                    label: "Mañana",
                    value: (() => {
                      const d = new Date(`${minBookingDate()}T12:00:00`);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().slice(0, 10);
                    })(),
                  },
                  {
                    label: "Pasado mañana",
                    value: (() => {
                      const d = new Date(`${minBookingDate()}T12:00:00`);
                      d.setDate(d.getDate() + 2);
                      return d.toISOString().slice(0, 10);
                    })(),
                  },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setDate(opt.value);
                      setHour("");
                      setHoursReady(false);
                      setHoursLoadFailed(false);
                      setError("");
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      date === opt.value
                        ? "bg-rose text-white"
                        : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-rose/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
            </div>
            <div>
              <label className="label" htmlFor="hour">
                Hora disponible <span className="text-rose-deep">*</span>
              </label>
              {!date ? (
                <p className="rounded-2xl border border-ink/10 bg-white/60 px-4 py-3 text-sm text-ink/50">
                  Las horas aparecerán cuando elijas la fecha.
                </p>
              ) : loadingHours ? (
                <p className="text-sm text-ink/50">Buscando horarios…</p>
              ) : hoursLoadFailed ? (
                <div className="space-y-3 rounded-2xl border border-rose/30 bg-rose-mist/50 px-4 py-3">
                  <p className="text-sm text-rose-deep">
                    No se pudieron cargar las horas. Revisa tu conexión e intenta
                    de nuevo.
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
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableHours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHour(h);
                        setError("");
                      }}
                      className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                        hour === h
                          ? "border-rose bg-rose text-white"
                          : "border-ink/10 bg-white text-ink hover:border-rose/40"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
              {date &&
                !loadingHours &&
                hoursReady &&
                !hoursLoadFailed &&
                availableHours.length === 0 && (
                  <p className="mt-2 text-sm text-rose-deep">
                    No hay horas disponibles para esta fecha. Prueba otro día.
                  </p>
                )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Nombre y apellido <span className="text-rose-deep">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="Nombre y apellido"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Teléfono / WhatsApp <span className="text-rose-deep">*</span>
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
          <div className="animate-fade-up space-y-5">
            <div className="rounded-2xl border border-rose/20 bg-rose-mist/40 p-3 text-sm leading-relaxed text-ink/80 sm:p-4">
              <p className="font-semibold text-ink">Instrucciones de pago</p>
              <p className="mt-2 break-words">
                Transfiere <strong>{formatColon(SALON.deposit)}</strong> por
                SINPE móvil al número{" "}
                <strong className="whitespace-nowrap">{SALON.sinpePhone}</strong>{" "}
                a nombre de <strong>{SALON.sinpeName}</strong>.
              </p>
              <p className="mt-2 break-words">
                En el detalle escribe tu nombre y apellido:{" "}
                <strong>{name || "tu nombre y apellido"}</strong>.
              </p>
              <p className="mt-3 break-words text-ink/60">
                {selectedService?.name} · {date} · {hour}
              </p>
            </div>

            <div className="min-w-0">
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
                className="field max-w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-rose file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white sm:file:px-4 sm:file:text-sm"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-rose/30 bg-rose-mist/50 px-4 py-3 text-sm text-rose-deep">
            {error}
          </p>
        )}

        {step > 0 && (
          <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              className="btn-secondary w-full sm:w-auto"
            >
              Atrás
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={primaryDisabled}
                className="btn-primary w-full disabled:opacity-60 sm:w-auto sm:min-w-[11rem]"
              >
                Continuar
              </button>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  disabled={primaryDisabled}
                  onClick={handleConfirm}
                  className="btn-primary w-full disabled:opacity-60 sm:min-w-[12rem]"
                >
                  {submitting ? "Enviando…" : "Confirmar reserva"}
                </button>
                {submitFailed && (
                  <a
                    href={whatsappFallbackLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary w-full text-center sm:w-auto"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

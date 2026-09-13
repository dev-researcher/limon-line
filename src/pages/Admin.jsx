import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { SALON, formatColon } from "../data/salon";
import {
  approvePayment,
  confirmWithoutSinpe,
  exportReservationsCSV,
  getAllReservations,
} from "../services/reservations";
import { refreshMonthReport } from "../services/monthlyReports";
import {
  PAYMENT_STATUS,
  paymentStatusLabel,
} from "../utils/paymentStatus";

function StatusBadge({ status }) {
  if (status === PAYMENT_STATUS.paid) {
    return <span className="font-semibold text-emerald-700">{paymentStatusLabel(status)}</span>;
  }
  if (status === PAYMENT_STATUS.confirmedNoSinpe) {
    return <span className="font-semibold text-amber-700">{paymentStatusLabel(status)}</span>;
  }
  return <span className="text-rose-deep">{paymentStatusLabel(status)}</span>;
}

export default function Admin() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getAllReservations();
      setBookings(rows);
    } catch {
      setBookings([]);
      setError("No se pudieron cargar las reservas. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let noSinpe = 0;
    let revenue = 0;
    bookings.forEach((b) => {
      const status = b.payment?.status || PAYMENT_STATUS.pending;
      if (status === PAYMENT_STATUS.paid) {
        paid += 1;
        revenue += b.amount || 0;
      } else if (status === PAYMENT_STATUS.confirmedNoSinpe) {
        noSinpe += 1;
      } else {
        pending += 1;
      }
    });
    return { paid, pending, noSinpe, revenue, total: bookings.length };
  }, [bookings]);

  const visible = bookings.filter((b) => {
    const status = b.payment?.status || PAYMENT_STATUS.pending;
    if (filter === "paid") return status === PAYMENT_STATUS.paid;
    if (filter === "pending") return status === PAYMENT_STATUS.pending;
    if (filter === "no_sinpe") return status === PAYMENT_STATUS.confirmedNoSinpe;
    return true;
  });

  const applyStatus = async (id, status, action) => {
    const booking = bookings.find((b) => b.id === id);
    setBusyId(id);
    try {
      await action(id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, payment: { ...b.payment, status }, pending_confirmation: false } : b
        )
      );
      if (booking?.date) {
        try {
          await refreshMonthReport(booking.date);
        } catch {
          // El reporte se puede regenerar manualmente en /admin/reportes
        }
      }
    } finally {
      setBusyId("");
    }
  };

  const handleApprove = (id) =>
    applyStatus(id, PAYMENT_STATUS.paid, approvePayment);

  const handleConfirmNoSinpe = (id) =>
    applyStatus(id, PAYMENT_STATUS.confirmedNoSinpe, confirmWithoutSinpe);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-ink/45 hover:text-rose-deep">
            ← Sitio público
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold">{SALON.name}</h1>
          <p className="text-ink/55">Panel de reservas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/reportes" className="btn-primary">
            Reportes mensuales
          </Link>
          <button type="button" onClick={() => exportReservationsCSV()} className="btn-secondary">
            Exportar CSV
          </button>
          <button type="button" onClick={handleLogout} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink/5 bg-white/80 p-5">
          <p className="text-sm text-ink/50">Reservas</p>
          <p className="mt-1 font-display text-3xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white/80 p-5">
          <p className="text-sm text-ink/50">Pendientes</p>
          <p className="mt-1 font-display text-3xl font-semibold text-rose-deep">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white/80 p-5">
          <p className="text-sm text-ink/50">Sin SINPE</p>
          <p className="mt-1 font-display text-3xl font-semibold text-amber-700">{stats.noSinpe}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white/80 p-5">
          <p className="text-sm text-ink/50">Ingresos confirmados</p>
          <p className="mt-1 font-display text-3xl font-semibold">{formatColon(stats.revenue)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "all", label: "Todas" },
          { id: "pending", label: "Pendientes" },
          { id: "paid", label: "Pagadas" },
          { id: "no_sinpe", label: "Sin SINPE" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === f.id ? "bg-rose text-white" : "bg-white text-ink/60"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto text-sm text-rose-deep hover:underline">
          Actualizar
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-deep">{error}</p>}

      {loading ? (
        <p className="py-12 text-center text-ink/50">Cargando reservas…</p>
      ) : error ? null : visible.length === 0 ? (
        <p className="py-12 text-center text-ink/50">
          No hay reservas por el momento.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-ink/5 bg-white/80">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Cita</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const status = b.payment?.status || PAYMENT_STATUS.pending;
                const pending = status === PAYMENT_STATUS.pending;
                return (
                  <tr key={b.id} className="border-t border-ink/5">
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName || b.name}</p>
                      <p className="text-xs text-ink/45">{b.phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {b.date || "—"}
                      <br />
                      <span className="text-ink/55">{b.hour || b.time || ""}</span>
                    </td>
                    <td className="px-4 py-3">{b.service}</td>
                    <td className="px-4 py-3">
                      <p>{formatColon(b.amount || SALON.deposit)}</p>
                      {b.payment?.proofUrl ? (
                        <a
                          href={b.payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-rose-deep underline"
                        >
                          Ver comprobante
                        </a>
                      ) : (
                        <span className="text-xs text-ink/35">Sin imagen</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pending ? (
                        <div className="flex flex-col gap-2 sm:min-w-[11rem]">
                          <button
                            type="button"
                            disabled={busyId === b.id}
                            onClick={() => handleApprove(b.id)}
                            className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Aprobar pago
                          </button>
                          <button
                            type="button"
                            disabled={busyId === b.id}
                            onClick={() => handleConfirmNoSinpe(b.id)}
                            className="rounded-full border border-amber-600/40 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-60"
                          >
                            Confirmar sin SINPE
                          </button>
                        </div>
                      ) : (
                        <StatusBadge status={status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

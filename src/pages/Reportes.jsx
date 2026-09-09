import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SALON, formatColon } from "../data/salon";
import {
  exportMonthlyReportCSV,
  formatMonthLabel,
  getSavedMonthlyReports,
  regenerateAndSaveMonthlyReports,
} from "../services/monthlyReports";

export default function Reportes() {
  const [reports, setReports] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await getSavedMonthlyReports();
      setReports(rows);
      if (rows.length && !selectedKey) {
        setSelectedKey(rows[0].monthKey);
      }
    } catch {
      setError(
        "No se pudieron cargar los reportes. Verifica las reglas de Firebase y que hayas iniciado sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => reports.find((r) => r.monthKey === selectedKey) || null,
    [reports, selectedKey]
  );

  const handleRegenerate = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const rows = await regenerateAndSaveMonthlyReports();
      setReports(rows);
      if (rows.length) {
        setSelectedKey((prev) =>
          rows.some((r) => r.monthKey === prev) ? prev : rows[0].monthKey
        );
      }
      setMessage(
        rows.length
          ? `Se actualizaron ${rows.length} reporte(s) mensual(es). Ya puedes consultarlos cuando quieras.`
          : "No hay reservas todavía para generar reportes."
      );
    } catch {
      setError(
        "No se pudieron guardar los reportes. Despliega las reglas de firestore.rules e inicia sesión como admin."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin" className="text-sm text-ink/45 hover:text-rose-deep">
            ← Panel de reservas
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            Reportes mensuales
          </h1>
          <p className="text-ink/55">
            Consulta el resumen de cada mes trabajado en {SALON.name}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? "Generando…" : "Actualizar reportes"}
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-2xl border border-rose/30 bg-rose-mist/50 px-4 py-3 text-sm text-rose-deep">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-ink/50">Cargando reportes…</p>
      ) : reports.length === 0 ? (
        <div className="rounded-[1.5rem] border border-ink/5 bg-white/80 p-10 text-center">
          <p className="text-ink/60">
            Aún no hay reportes guardados. Genera el primero a partir de las reservas.
          </p>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={saving}
            className="btn-primary mt-6"
          >
            Generar reportes
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
              Meses
            </p>
            {reports.map((r) => (
              <button
                key={r.monthKey}
                type="button"
                onClick={() => setSelectedKey(r.monthKey)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                  selectedKey === r.monthKey
                    ? "bg-rose text-white"
                    : "bg-white/80 text-ink/70 hover:bg-rose-mist/60"
                }`}
              >
                <span className="font-semibold">
                  {r.label || formatMonthLabel(r.monthKey)}
                </span>
                <span className="mt-1 block text-xs opacity-80">
                  {r.totalReservations} reservas · {formatColon(r.totalRevenue || 0)}
                </span>
              </button>
            ))}
          </aside>

          {selected && (
            <section className="space-y-6">
              <div className="rounded-[1.5rem] border border-ink/5 bg-white/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl font-semibold">
                      {selected.label || formatMonthLabel(selected.monthKey)}
                    </h2>
                    <p className="mt-1 text-sm text-ink/50">
                      Mes {selected.monthKey}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportMonthlyReportCSV(selected)}
                    className="btn-secondary"
                  >
                    Exportar CSV del mes
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Reservas" value={selected.totalReservations} />
                  <Stat label="Pagadas" value={selected.paidCount} />
                  <Stat label="Pendientes" value={selected.pendingCount} />
                  <Stat
                    label="Ingresos confirmados"
                    value={formatColon(selected.totalRevenue || 0)}
                  />
                </div>

                {selected.pendingRevenue > 0 && (
                  <p className="mt-4 text-sm text-ink/55">
                    Pendiente por confirmar:{" "}
                    <strong>{formatColon(selected.pendingRevenue)}</strong>
                  </p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-ink/5 bg-white/80 p-6">
                <h3 className="font-display text-2xl font-semibold">
                  Servicios del mes
                </h3>
                {(selected.topServices || Object.entries(selected.services || {})).length ===
                0 ? (
                  <p className="mt-3 text-sm text-ink/50">Sin datos de servicios.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {(
                      selected.topServices ||
                      Object.entries(selected.services || {}).map(([name, count]) => ({
                        name,
                        count,
                      }))
                    ).map((s) => (
                      <li
                        key={s.name}
                        className="flex items-center justify-between border-b border-ink/5 py-2 text-sm"
                      >
                        <span>{s.name}</span>
                        <span className="font-semibold text-rose-deep">{s.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="overflow-x-auto rounded-[1.5rem] border border-ink/5 bg-white/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-ink/10 text-ink/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Servicio</th>
                      <th className="px-4 py-3 font-medium">Monto</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.bookings || []).map((b) => (
                      <tr key={b.id || `${b.date}-${b.hour}-${b.customerName}`} className="border-t border-ink/5">
                        <td className="px-4 py-3">
                          {b.date}
                          <br />
                          <span className="text-ink/50">{b.hour}</span>
                        </td>
                        <td className="px-4 py-3">
                          {b.customerName}
                          <br />
                          <span className="text-xs text-ink/45">{b.phone || "—"}</span>
                        </td>
                        <td className="px-4 py-3">{b.service}</td>
                        <td className="px-4 py-3">{formatColon(b.amount)}</td>
                        <td className="px-4 py-3">
                          {b.paymentStatus === "paid" ? (
                            <span className="font-semibold text-emerald-700">Pagado</span>
                          ) : (
                            <span className="text-rose-deep">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-rose-mist/40 px-4 py-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

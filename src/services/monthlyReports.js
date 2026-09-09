import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { SALON } from "../data/salon";
import { getAllReservations } from "./reservations";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthKeyFromDate(dateStr) {
  if (!dateStr || dateStr.length < 7) return null;
  return dateStr.slice(0, 7); // YYYY-MM
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return "";
  const [y, m] = monthKey.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function reportDocId(monthKey) {
  return `${SALON.id}_${monthKey}`;
}

function emptyReport(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    businessId: SALON.id,
    monthKey,
    year,
    month,
    label: formatMonthLabel(monthKey),
    totalReservations: 0,
    paidCount: 0,
    pendingCount: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    services: {},
    bookings: [],
  };
}

/** Agrupa reservas en reportes mensuales (en memoria). */
export function buildMonthlyReportsFromReservations(reservations) {
  const byMonth = new Map();

  reservations.forEach((r) => {
    const key = monthKeyFromDate(r.date);
    if (!key) return;

    if (!byMonth.has(key)) byMonth.set(key, emptyReport(key));
    const report = byMonth.get(key);

    const amount = Number(r.amount) || SALON.deposit || 0;
    const paid = r.payment?.status === "paid";
    const service = r.service || "Sin servicio";

    report.totalReservations += 1;
    if (paid) {
      report.paidCount += 1;
      report.totalRevenue += amount;
    } else {
      report.pendingCount += 1;
      report.pendingRevenue += amount;
    }

    report.services[service] = (report.services[service] || 0) + 1;
    report.bookings.push({
      id: r.id,
      date: r.date || "",
      hour: r.hour || r.time || "",
      customerName: r.customerName || r.name || "",
      phone: r.phone || "",
      service,
      amount,
      paymentStatus: r.payment?.status || "pending",
      proofUrl: r.payment?.proofUrl || null,
    });
  });

  const reports = Array.from(byMonth.values()).map((report) => {
    report.bookings.sort((a, b) =>
      `${b.date} ${b.hour}`.localeCompare(`${a.date} ${a.hour}`)
    );
    report.topServices = Object.entries(report.services)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return report;
  });

  return reports.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

/** Lee reportes guardados en Firestore (consultables en cualquier momento). */
export async function getSavedMonthlyReports() {
  const q = query(
    collection(db, "monthly_reports"),
    where("businessId", "==", SALON.id)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.monthKey || "").localeCompare(a.monthKey || ""));
}

export async function getSavedMonthlyReport(monthKey) {
  const reports = await getSavedMonthlyReports();
  return reports.find((r) => r.monthKey === monthKey) || null;
}

/** Regenera todos los meses desde reservas y los guarda en Firestore. */
export async function regenerateAndSaveMonthlyReports() {
  const reservations = await getAllReservations();
  const reports = buildMonthlyReportsFromReservations(reservations);

  await Promise.all(
    reports.map((report) =>
      setDoc(
        doc(db, "monthly_reports", reportDocId(report.monthKey)),
        {
          ...report,
          updatedAt: serverTimestamp(),
          generatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );

  return reports;
}

/** Actualiza solo el reporte del mes de una fecha concreta. */
export async function refreshMonthReport(dateStr) {
  const key = monthKeyFromDate(dateStr);
  if (!key) return null;

  const reservations = await getAllReservations();
  const ofMonth = reservations.filter((r) => monthKeyFromDate(r.date) === key);
  const [report] = buildMonthlyReportsFromReservations(ofMonth);

  if (!report) {
    // Mes sin reservas: guardar vacío para historial si se desea, o no crear
    return null;
  }

  await setDoc(
    doc(db, "monthly_reports", reportDocId(key)),
    {
      ...report,
      updatedAt: serverTimestamp(),
      generatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return report;
}

export function exportMonthlyReportCSV(report) {
  if (!report) return;
  let csv = "Fecha,Hora,Cliente,Teléfono,Servicio,Monto,Estado\n";
  (report.bookings || []).forEach((r) => {
    csv += `${r.date},${r.hour},${r.customerName},${r.phone},${r.service},${r.amount},${r.paymentStatus}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte_${report.monthKey}_${SALON.id}.csv`;
  a.click();
}

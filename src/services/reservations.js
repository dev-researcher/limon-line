import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { SALON } from "../data/salon";

export async function getReservationsByDate(date) {
  // Consulta por un solo campo para no depender de índice compuesto
  // (businessId + date). Filtramos el salón en el cliente.
  try {
    const q = query(collection(db, "reservations_db"), where("date", "==", date));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.businessId === SALON.id);
  } catch (err) {
    // Reglas de Firebase aún no publicadas → permission-denied.
    // Devolvemos [] para poder mostrar horas del horario local.
    console.error("getReservationsByDate:", err?.code || err);
    if (err?.code === "permission-denied") return [];
    throw err;
  }
}

export async function getAllReservations() {
  const q = query(
    collection(db, "reservations_db"),
    where("businessId", "==", SALON.id)
  );
  const snapshot = await getDocs(q);
  const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => {
    const da = `${a.date || ""} ${a.hour || a.time || ""}`;
    const dbv = `${b.date || ""} ${b.hour || b.time || ""}`;
    return dbv.localeCompare(da);
  });
}

export async function createReservation(payload) {
  const reservationRef = await addDoc(collection(db, "reservations_db"), {
    businessId: SALON.id,
    amount: Number(SALON.deposit),
    date: payload.date,
    service: payload.service,
    hour: payload.hour || payload.time || "",
    time: payload.hour || payload.time || "",
    duration: payload.duration || 1,
    customerName: payload.customerName || payload.name || "",
    name: payload.name || payload.customerName || "",
    phone: payload.phone || "",
    hasProof: Boolean(payload.hasProof),
    createdAt: new Date(),
    payment: {
      status: "pending",
      provider: "sinpe",
    },
    pending_confirmation: true,
  });
  return reservationRef.id;
}

export async function attachProof(reservationId, proofUrl) {
  await updateDoc(doc(db, "reservations_db", reservationId), {
    "payment.proofUrl": proofUrl,
  });
}

export async function approvePayment(reservationId) {
  await updateDoc(doc(db, "reservations_db", reservationId), {
    "payment.status": "paid",
    pending_confirmation: false,
  });
}

export async function exportReservationsCSV() {
  const rows = await getAllReservations();
  let csv = "Fecha,Hora,Cliente,Teléfono,Servicio,Monto,Estado\n";
  rows.forEach((r) => {
    csv += `${r.date || ""},${r.hour || r.time || ""},${r.customerName || r.name || ""},${r.phone || ""},${r.service || ""},${r.amount || ""},${r.payment?.status || "pending"}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservas_${SALON.id}.csv`;
  a.click();
}

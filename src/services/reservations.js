import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { SALON } from "../data/salon";
import { ensureBookingSession } from "./bookingAuth";

async function backupCreate(reservation) {
  try {
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservation),
    });
  } catch (err) {
    console.error("backupCreate:", err);
  }
}

async function backupUpdate(id, patch) {
  try {
    await fetch("/api/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
  } catch (err) {
    console.error("backupUpdate:", err);
  }
}

async function loadBackupReservations() {
  const res = await fetch("/api/reservations", { cache: "no-store" });
  if (!res.ok) throw new Error("backup-failed");
  const data = await res.json();
  return Array.isArray(data.bookings) ? data.bookings : [];
}

export async function getReservationsByDate(date) {
  try {
    await ensureBookingSession();
    const q = query(collection(db, "reservations_db"), where("date", "==", date));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => r.businessId === SALON.id);
  } catch (err) {
    console.error("getReservationsByDate:", err?.code || err);
    if (err?.code === "permission-denied") {
      try {
        const rows = await loadBackupReservations();
        return rows.filter((r) => r.date === date && r.businessId === SALON.id);
      } catch {
        return [];
      }
    }
    throw err;
  }
}

export async function getAllReservations() {
  try {
    if (!auth.currentUser) {
      await ensureBookingSession();
    }
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
  } catch (err) {
    console.error("getAllReservations:", err?.code || err);
    // Fallback: lista desde respaldo en Vercel Blob
    if (err?.code === "permission-denied") {
      return loadBackupReservations();
    }
    throw err;
  }
}

export async function createReservation(payload) {
  const user = await ensureBookingSession();
  const data = {
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
    createdBy: user?.uid || null,
    payment: {
      status: "pending",
      provider: "sinpe",
    },
    pending_confirmation: true,
  };

  let id = `local_${Date.now()}`;
  try {
    const reservationRef = await addDoc(collection(db, "reservations_db"), data);
    id = reservationRef.id;
  } catch (err) {
    console.error("Firestore create failed, using backup only:", err?.code || err);
  }

  await backupCreate({
    id,
    ...data,
    createdAt: new Date().toISOString(),
  });

  return id;
}

export async function attachProof(reservationId, proofUrl) {
  try {
    await updateDoc(doc(db, "reservations_db", reservationId), {
      "payment.proofUrl": proofUrl,
      hasProof: true,
    });
  } catch (err) {
    console.error("attachProof firestore:", err?.code || err);
  }
  await backupUpdate(reservationId, {
    hasProof: true,
    payment: { proofUrl, status: "pending", provider: "sinpe" },
  });
}

export async function approvePayment(reservationId) {
  try {
    await updateDoc(doc(db, "reservations_db", reservationId), {
      "payment.status": "paid",
      pending_confirmation: false,
    });
  } catch (err) {
    console.error("approvePayment firestore:", err?.code || err);
  }
  await backupUpdate(reservationId, {
    pending_confirmation: false,
    payment: { status: "paid", provider: "sinpe" },
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

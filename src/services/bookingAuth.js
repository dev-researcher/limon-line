import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Cuenta técnica para que el público pueda crear reservas
// (las reglas actuales de Firebase exigen usuario autenticado para create).
const BOOKING_EMAIL = "reservas@aaglamstudio.com";
const BOOKING_PASSWORD = "ReservasAA2026!";

function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

/**
 * Asegura una sesión autenticada antes de guardar la reserva.
 * Si ya hay usuario (p. ej. admin), lo reutiliza.
 */
export async function ensureBookingSession() {
  const current = auth.currentUser || (await waitForAuthUser());
  if (current) return current;

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      BOOKING_EMAIL,
      BOOKING_PASSWORD
    );
    return cred.user;
  } catch (err) {
    if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
      try {
        const created = await createUserWithEmailAndPassword(
          auth,
          BOOKING_EMAIL,
          BOOKING_PASSWORD
        );
        return created.user;
      } catch (createErr) {
        if (createErr?.code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(
            auth,
            BOOKING_EMAIL,
            BOOKING_PASSWORD
          );
          return cred.user;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

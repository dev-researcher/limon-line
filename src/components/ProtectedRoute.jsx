import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const ADMIN_EMAILS = ["admin@aaglamstudio.com"];

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      if (current && !ADMIN_EMAILS.includes((current.email || "").toLowerCase())) {
        // Evita que la cuenta técnica de reservas entre al panel
        await signOut(auth);
        setUser(null);
      } else {
        setUser(current);
      }
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink/60">
        Verificando acceso…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

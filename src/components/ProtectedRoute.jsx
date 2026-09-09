import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
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

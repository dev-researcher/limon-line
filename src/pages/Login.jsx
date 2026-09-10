import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { SALON } from "../data/salon";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-[2rem] border border-ink/5 bg-white/80 p-8 shadow-sm backdrop-blur"
      >
        <div className="text-center">
          <Link to="/" className="font-display text-3xl font-semibold text-ink">
            {SALON.name}
          </Link>
          <h1 className="mt-4 text-lg font-semibold text-ink/80">Administración</h1>
          <p className="mt-1 text-sm text-ink/50">Inicia sesión para gestionar reservas</p>
          <p className="mt-3 rounded-xl bg-rose-mist/50 px-3 py-2 text-xs text-ink/60">
            Usuario: <strong>admin@aaglamstudio.com</strong>
          </p>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            required
          />
        </div>

        {error && <p className="text-sm text-rose-deep">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <Link to="/" className="block text-center text-sm text-ink/45 hover:text-rose-deep">
          Volver al sitio
        </Link>
      </form>
    </div>
  );
}

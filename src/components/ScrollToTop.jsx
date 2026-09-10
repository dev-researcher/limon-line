import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Al cambiar de ruta, siempre empieza arriba de la página. */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  }, [pathname, search]);

  return null;
}

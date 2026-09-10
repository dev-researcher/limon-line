import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Reservar from "./pages/Reservar";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Reportes from "./pages/Reportes";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/reservar" element={<Layout><Reservar /></Layout>} />
        <Route path="/login" element={<Layout bare><Login /></Layout>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout bare>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute>
              <Layout bare>
                <Reportes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

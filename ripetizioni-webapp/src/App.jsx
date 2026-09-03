import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Studenti from "./pages/Studenti";
import StudenteDettaglio from "./pages/StudenteDettaglio";
import Valutazioni from "./pages/Valutazioni";
import Report from "./pages/Report";
import Impostazioni from "./pages/Impostazioni";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Rotta pubblica */}
      <Route path="/login" element={<Login />} />

      {/* Tutte le rotte protette */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="studenti" element={<Studenti />} />
        <Route path="studenti/:id" element={<StudenteDettaglio />} />
        <Route path="valutazioni" element={<Valutazioni />} />
        <Route path="report" element={<Report />} />
        <Route path="impostazioni" element={<Impostazioni />} />
      </Route>

      {/* Qualsiasi rotta sconosciuta → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

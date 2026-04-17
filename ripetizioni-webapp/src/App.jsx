import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendario from "./pages/Calendario";
import Studenti from "./pages/Studenti";
import StudenteDettaglio from "./pages/StudenteDettaglio";
import Report from "./pages/Report";
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
        <Route path="calendario" element={<Calendario />} />
        <Route path="studenti" element={<Studenti />} />
        <Route path="studenti/:id" element={<StudenteDettaglio />} />
        <Route path="report" element={<Report />} />
      </Route>

      {/* Qualsiasi rotta sconosciuta → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
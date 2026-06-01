import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider, ProtectedRoute, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Ouvriers from "@/pages/Ouvriers";
import Engins from "@/pages/Engins";
import Pointage from "@/pages/Pointage";
import Cameras from "@/pages/Cameras";
import Absences from "@/pages/Absences";
import Paie from "@/pages/Paie";
import Rapports from "@/pages/Rapports";
import RHDashboard from "@/pages/RHDashboard";
import SuperviseurDashboard from "@/pages/SuperviseurDashboard";
import SuperviseurControleurs from "@/pages/SuperviseurControleurs";
import ControleurTerminal from "@/pages/ControleurTerminal";
import ControleurJournal from "@/pages/ControleurJournal";
import PompisteTerminal from "@/pages/PompisteTerminal";
import PompisteRapport from "@/pages/PompisteRapport";
import Utilisateurs from "@/pages/Utilisateurs";
import Documentation from "@/pages/Documentation";
import SousTraitants from "@/pages/SousTraitants";
import SystemAdmin from "@/pages/SystemAdmin";

function HomeRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "super_admin") return <Navigate to="/system" replace />;
  if (user.role === "admin") return <Dashboard />;
  if (user.role === "superviseur") return <Navigate to="/superviseur" replace />;
  if (user.role === "rh") return <Navigate to="/rh" replace />;
  if (user.role === "controleur") return <Navigate to="/controleur" replace />;
  if (user.role === "pompiste") return <Navigate to="/pompiste" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><HomeRoute /></ProtectedRoute>} />
          <Route path="/ouvriers" element={<ProtectedRoute roles={["admin", "superviseur", "rh"]}><Ouvriers /></ProtectedRoute>} />
          <Route path="/engins" element={<ProtectedRoute roles={["admin", "superviseur"]}><Engins /></ProtectedRoute>} />
          <Route path="/pointage" element={<ProtectedRoute roles={["admin", "superviseur"]}><Pointage /></ProtectedRoute>} />
          <Route path="/cameras" element={<ProtectedRoute roles={["admin", "superviseur"]}><Cameras /></ProtectedRoute>} />
          <Route path="/carburant" element={<ProtectedRoute roles={["admin", "superviseur"]}><Engins /></ProtectedRoute>} />
          <Route path="/absences" element={<ProtectedRoute roles={["admin", "rh", "superviseur"]}><Absences /></ProtectedRoute>} />
          <Route path="/paie" element={<ProtectedRoute roles={["admin", "rh"]}><Paie /></ProtectedRoute>} />
          <Route path="/sous-traitants" element={<ProtectedRoute roles={["admin", "superviseur", "rh"]}><SousTraitants /></ProtectedRoute>} />
          <Route path="/rapports" element={<ProtectedRoute roles={["admin"]}><Rapports /></ProtectedRoute>} />
          <Route path="/utilisateurs" element={<ProtectedRoute roles={["admin", "super_admin"]}><Utilisateurs /></ProtectedRoute>} />
          <Route path="/system" element={<ProtectedRoute roles={["super_admin"]}><SystemAdmin /></ProtectedRoute>} />
          <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
          <Route path="/rh" element={<ProtectedRoute roles={["admin", "rh"]}><RHDashboard /></ProtectedRoute>} />
          <Route path="/superviseur" element={<ProtectedRoute roles={["admin", "superviseur"]}><SuperviseurDashboard /></ProtectedRoute>} />
          <Route path="/superviseur-controleurs" element={<ProtectedRoute roles={["admin", "superviseur"]}><SuperviseurControleurs /></ProtectedRoute>} />
          <Route path="/controleur" element={<ProtectedRoute roles={["admin", "controleur"]}><ControleurTerminal /></ProtectedRoute>} />
          <Route path="/controleur-journal" element={<ProtectedRoute roles={["admin", "controleur"]}><ControleurJournal /></ProtectedRoute>} />
          <Route path="/pompiste" element={<ProtectedRoute roles={["admin", "pompiste"]}><PompisteTerminal /></ProtectedRoute>} />
          <Route path="/pompiste-rapport" element={<ProtectedRoute roles={["admin", "pompiste"]}><PompisteRapport /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

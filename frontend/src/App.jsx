import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import Loading from "./components/Loading";
import { useAuth } from "./context/AuthContext";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const FacultyProfilePage = lazy(() => import("./pages/FacultyProfilePage"));
const FacultyGoalsPage = lazy(() => import("./pages/FacultyGoalsPage"));
const FacultyDirectoryPage = lazy(() => import("./pages/FacultyDirectoryPage"));
const Page = ({ children }) => <Suspense fallback={<Loading />}>{children}</Suspense>;

function Protected({ children }) {
  const { user } = useAuth();
  return user && localStorage.getItem("fpis_token") ? children : <Navigate to="/login" replace />;
}

function RequireRoles({ roles, children }) {
  const { user } = useAuth();
  const rawRole = String(user?.role || user?.roles?.[0] || "FACULTY").replace(/^ROLE_/i, "").toUpperCase();
  const role = rawRole === "HOD" ? "COORDINATOR" : rawRole === "DEAN" ? "ADMIN" : rawRole;
  return roles.includes(role) ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user && localStorage.getItem("fpis_token") ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Page><DashboardPage /></Page>} />
        <Route path="profile" element={<RequireRoles roles={["FACULTY"]}><Page><FacultyProfilePage /></Page></RequireRoles>} />
        <Route path="goals" element={<RequireRoles roles={["FACULTY"]}><Page><FacultyGoalsPage /></Page></RequireRoles>} />
        <Route path="faculty" element={<RequireRoles roles={["ADMIN", "COORDINATOR"]}><Page><FacultyDirectoryPage /></Page></RequireRoles>} />
        <Route path="contributions" element={<Page><ModulePage module="contributions" /></Page>} />
        <Route path="approvals" element={<RequireRoles roles={["ADMIN", "COORDINATOR"]}><Page><ModulePage module="approvals" /></Page></RequireRoles>} />
        <Route path="workload" element={<Page><ModulePage module="workload" /></Page>} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="scheduling" element={<RequireRoles roles={["ADMIN", "COORDINATOR"]}><Page><ModulePage module="scheduling" /></Page></RequireRoles>} />
        <Route path="performance" element={<Page><ModulePage module="performance" /></Page>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

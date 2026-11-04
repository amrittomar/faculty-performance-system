import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, Bell, CalendarDays, ChartNoAxesCombined, ClipboardCheck,
  GraduationCap, LayoutDashboard, LogOut, Menu, Users, BriefcaseBusiness,
  CalendarClock, Sparkles, UserRound, Flag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/profile", label: "My profile", icon: UserRound, roles: ["FACULTY"] },
  { to: "/faculty", label: "Faculty", icon: Users, roles: ["ADMIN", "COORDINATOR"] },
  { to: "/contributions", label: "Contributions", icon: Activity },
  { to: "/goals", label: "Goals & reminders", icon: Flag, roles: ["FACULTY"] },
  { to: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["ADMIN", "COORDINATOR"] },
  { to: "/workload", label: "Workload", icon: BriefcaseBusiness },
  { to: "/calendar", label: "Timetable", icon: CalendarClock },
  { to: "/scheduling", label: "Smart scheduling", icon: CalendarClock, roles: ["ADMIN", "COORDINATOR"] },
  { to: "/performance", label: "Performance", icon: ChartNoAxesCombined },
];

export default function AppLayout() {
  const { user, profileError, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const rawRole = String(user?.role || user?.roles?.[0] || "FACULTY").replace("ROLE_", "").toUpperCase();
  const role = rawRole === "HOD" ? "COORDINATOR" : rawRole === "DEAN" ? "ADMIN" : rawRole;
  const name = user?.fullName || user?.name || user?.email || "Faculty member";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const visibleLinks = links.filter((link) => !link.roles || link.roles.includes(role));
  const currentPage = visibleLinks.find((link) => link.to === location.pathname)?.label || "Workspace";

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23} /></div>
          <div><strong>fpis</strong><span>Faculty intelligence</span></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
              {label === "Approvals" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><Sparkles size={17} /><div><strong>Make progress visible</strong><span>Every contribution counts.</span></div></div>
          <button className="profile-button" onClick={signOut}>
            <span className="avatar">{initials || "FP"}</span>
            <span className="profile-copy"><strong>{name}</strong><small>{user?.jobTitle || "Designation not set"}</small></span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{currentPage}</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            <button className="icon-button notification-button" aria-label="Open pending items" title="Open pending items" onClick={() => navigate(["ADMIN", "COORDINATOR"].includes(role) ? "/approvals" : role === "FACULTY" ? "/goals" : "/contributions")}><Bell size={18} /><i /></button>
          </div>
        </header>
        <section className="page-content">
          {profileError && <div className="alert error" role="alert">{profileError}</div>}
          <Outlet />
        </section>
      </main>
    </div>
  );
}

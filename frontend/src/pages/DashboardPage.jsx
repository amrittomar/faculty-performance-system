import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, ArrowUpRight, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, CheckCircle2,
  ClipboardCheck, GraduationCap, Sparkles, Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";
import DataTable from "../components/DataTable";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const palette = ["#2457e6", "#00866a", "#e87917", "#1674b8", "#c52b53", "#6b49ca"];
const takeArray = (...values) => values.find(Array.isArray) || [];
const number = (...values) => values.find((value) => typeof value === "number") ?? "—";

export default function DashboardPage() {
  const { user } = useAuth();
  const rawRole = String(user?.role || user?.roles?.[0] || "FACULTY").replace("ROLE_", "").toUpperCase();
  const role = rawRole === "HOD" ? "COORDINATOR" : rawRole === "DEAN" ? "ADMIN" : rawRole;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const navigate = useNavigate();
  const [refreshVersion, setRefreshVersion] = useState(0);

  const load = useCallback(() => {
    let active = true;
    const endpoint = role === "ADMIN" ? "/dashboard/admin" : role === "COORDINATOR" ? "/dashboard/coordinator" : "/dashboard/faculty";
    setBusy(true);
    setError("");
    api.get(endpoint).then(({ data: result }) => {
      if (active) setData(result);
    }).catch((requestError) => {
      if (active) setError(getErrorMessage(requestError));
    }).finally(() => {
      if (active) setBusy(false);
    });
    return () => { active = false; };
  }, [role]);

  useEffect(() => load(), [load, refreshVersion]);

  if (busy) return <Loading />;
  const metrics = data?.metrics || data || {};
  const activities = takeArray(data?.recentActivities, data?.activities, data?.recentContributions);
  const workload = takeArray(data?.workloadDistribution, data?.workload, data?.departmentWorkload);
  const performance = takeArray(data?.performanceTrend, data?.performance, data?.departmentPerformance);
  const score = number(metrics.averagePerformanceScore, metrics.performanceScore, data?.averageScore, data?.performanceScore);
  const pending = number(metrics.pendingApprovals, metrics.pendingCount, metrics.pendingContributions, data?.pendingApprovals);
  const facultyCount = number(metrics.totalFaculty, metrics.facultyCount, data?.totalFaculty);

  return (
    <>
      <PageHeader eyebrow={`${role} DASHBOARD`} title={`Good day, ${user?.fullName || user?.email || "there"}`} description="Here's a clear view of your academic impact and what needs attention." action={<button className="button subtle" disabled={busy} onClick={() => setRefreshVersion((version) => version + 1)}><Activity size={16} /> {busy ? "Refreshing…" : "Refresh data"}</button>} />
      {error && <div className="alert error" role="alert">Dashboard data could not be loaded: {error}</div>}
      <div className="stats-grid">
        <StatCard icon={Users} label={role === "FACULTY" ? "My activities" : "Faculty members"} value={role === "FACULTY" ? number(metrics.totalActivities, metrics.completedActivities, data?.totalActivities) : facultyCount} note={role === "FACULTY" ? "Contributions this cycle" : "Across your organization"} tone="violet" />
        <StatCard icon={ClipboardCheck} label="Pending approvals" value={pending} note="Items awaiting review" tone="amber" />
        <StatCard icon={ChartNoAxesCombined} label="Performance score" value={typeof score === "number" ? `${score.toFixed(1)}/100` : score} note="Based on approved activity" tone="teal" />
        <StatCard icon={BriefcaseBusiness} label="Workload utilization" value={metrics.workloadUtilization != null || data?.workloadUtilization != null ? `${metrics.workloadUtilization ?? data.workloadUtilization}%` : "—"} note={metrics.workloadStatus || data?.workloadStatus || "Current workload"} tone="blue" />
      </div>
      <div className="dashboard-grid">
        <article className="panel trend-panel">
          <div className="panel-heading"><div><h2>{role === "FACULTY" ? "Performance overview" : "Department performance"}</h2><p>Approved contributions over time</p></div><Link className="icon-button" aria-label="View performance" to="/performance"><ArrowUpRight size={18} /></Link></div>
          {performance.length ? <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performance}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2457e6" stopOpacity={0.22} /><stop offset="95%" stopColor="#2457e6" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#dfe5ee" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#52627a", fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#52627a", fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="score" stroke="#2457e6" strokeWidth={3} fill="url(#scoreFill)" /></AreaChart></ResponsiveContainer></div> : <div className="chart-empty"><div className="empty-illustration"><Sparkles size={23} /></div><strong>Your progress will show here</strong><span>Once data is available, approved activity trends will appear.</span></div>}
        </article>
        <article className="panel workload-panel">
          <div className="panel-heading"><div><h2>Activity mix</h2><p>Distribution by category</p></div></div>
          {workload.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={workload} dataKey="hours" nameKey="category" innerRadius={66} outerRadius={88} paddingAngle={4} stroke="none">{workload.map((item, index) => <Cell key={item.category || index} fill={palette[index % palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{number(metrics.totalWorkload, data?.totalWorkload) === "—" ? "—" : `${number(metrics.totalWorkload, data?.totalWorkload)}h`}</strong><span>total hours</span></div></div><div className="legend-list">{workload.slice(0, 4).map((item, index) => <div key={item.category || index}><i style={{ background: palette[index % palette.length] }} /><span>{item.category || item.name || "Other"}</span><b>{item.hours ?? item.value ?? "—"}h</b></div>)}</div></> : <div className="chart-empty compact"><div className="empty-illustration mint"><BriefcaseBusiness size={21} /></div><strong>Workload balance</strong><span>Your activity distribution appears here.</span></div>}
        </article>
        <article className="panel activity-panel">
          <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest updates across your workspace</p></div><span className="live-tag"><i /> LIVE</span></div>
          <DataTable columns={[
            { key: "title", label: "Activity", render: (value, row) => <div className="activity-cell"><span className="activity-avatar"><GraduationCap size={15} /></span><div><strong>{value || row.activityTitle || row.description || "Academic contribution"}</strong><small>{row.facultyName || row.category || "Contribution"}</small></div></div> },
            { key: "date", label: "Date" },
            { key: "status", label: "Status", render: (value) => value ? <span className={`status-pill ${String(value).toLowerCase()}`}>{value}</span> : "—" },
          ]} rows={activities.slice(0, 5)} empty="New submissions and approvals will appear here." />
        </article>
        <article className="panel focus-panel">
          <div className="focus-icon"><CalendarDays size={20} /></div>
          <div><span className="eyebrow">NEXT UP</span><h2>Stay in rhythm</h2><p>Keep your calendar and contributions current to see your full academic impact.</p></div>
          <Link to="/calendar" className="text-link">View academic calendar <ArrowUpRight size={15} /></Link>
        </article>
      </div>
      <div className="dashboard-footnote"><CheckCircle2 size={15} /> Scores reflect approved activities only. <span>Transparent by design.</span><button className="text-link" onClick={() => navigate("/performance")}>View scoring breakdown <ArrowUpRight size={14} /></button></div>
    </>
  );
}

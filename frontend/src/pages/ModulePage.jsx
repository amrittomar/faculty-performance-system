import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, Plus, Search, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const contributionCategories = ["TEACHING", "RESEARCH", "SERVICE", "DEVELOPMENT"];
const configs = {
  faculty: { title: "Faculty directory", description: "Explore faculty profiles, expertise, and current capacity.", endpoint: "/faculty", fields: [{ key: "fullName", label: "Faculty member" }, { key: "departmentName", label: "Department" }, { key: "role", label: "Role" }, { key: "email", label: "Email" }, { key: "active", label: "Status", render: (value) => <span className={`status-pill ${value ? "approved" : "rejected"}`}>{value ? "Active" : "Inactive"}</span> }] },
  contributions: { title: "Contributions", description: "A transparent record of teaching, research, mentoring, and engagement.", endpoint: "/contributions", fields: [{ key: "title", label: "Activity" }, { key: "category", label: "Category" }, { key: "occurredOn", label: "Date" }, { key: "points", label: "Points" }, { key: "status", label: "Status", render: (value) => <span className={`status-pill ${String(value || "").toLowerCase()}`}>{value || "—"}</span> }] },
  approvals: { title: "Review & approvals", description: "Review faculty submissions and keep the approval process moving.", endpoint: "/contributions/pending", fields: [{ key: "title", label: "Submission" }, { key: "facultyName", label: "Submitted by" }, { key: "category", label: "Category" }, { key: "createdAt", label: "Submitted", render: (value) => value ? new Date(value).toLocaleDateString() : "—" }, { key: "review", label: "Review", render: (_, row) => <ReviewActions contribution={row} onDone={() => window.dispatchEvent(new Event("fpis-refresh"))} /> }] },
  workload: { title: "Workload overview", description: "Understand weekly assignments and identify capacity constraints.", endpoint: "/workloads", fields: [{ key: "facultyName", label: "Faculty member" }, { key: "academicYear", label: "Academic year" }, { key: "term", label: "Term" }, { key: "teachingHours", label: "Teaching" }, { key: "researchHours", label: "Research" }, { key: "serviceHours", label: "Service" }, { key: "totalHours", label: "Total hours" }] },
  performance: { title: "Performance & impact", description: "Explainable scoring based on approved contributions and configured category weights.", endpoint: "/performance", fields: [{ key: "facultyName", label: "Faculty member" }, { key: "score", label: "Score", render: (value) => `${Number(value || 0).toFixed(1)} / 100` }, { key: "components", label: "Breakdown", render: (components = []) => <div className="score-components">{components.map((part) => <span key={part.category}>{part.category}: {Number(part.weightedPoints).toFixed(1)}</span>)}</div> }] },
  scheduling: { title: "Smart scheduling", description: "Find a conflict-free time slot on your academic calendar.", endpoint: null, fields: [] },
};

function normalizedRole(user) {
  const raw = String(user?.role || user?.roles?.[0] || "FACULTY").replace(/^ROLE_/i, "").toUpperCase();
  return raw === "HOD" ? "COORDINATOR" : raw === "DEAN" ? "ADMIN" : raw;
}

function exportRows(rows, columns, filename) {
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [columns.map((column) => escapeCell(column.label)).join(","), ...rows.map((row) => columns.map((column) => {
    const value = row[column.key];
    return escapeCell(Array.isArray(value) ? value.map((item) => item.category ? `${item.category}: ${item.weightedPoints}` : JSON.stringify(item)).join("; ") : typeof value === "object" && value ? JSON.stringify(value) : value);
  }).join(","))];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReviewActions({ contribution, onDone }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const review = async (status) => {
    if (!contribution.id) return setError("Submission ID is missing.");
    setBusy(true);
    setError("");
    try {
      await api.post(`/contributions/${contribution.id}/review`, { status, comment: status === "REJECTED" ? comment.trim() : "" });
      onDone();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  if (rejecting) return <div className="reject-editor"><input aria-label="Rejection reason" required value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Reason required" /><button className="reject-action" disabled={busy || !comment.trim()} onClick={() => review("REJECTED")}>Confirm</button><button className="icon-button" disabled={busy} onClick={() => setRejecting(false)} aria-label="Cancel rejection"><X size={14} /></button>{error && <small className="inline-error">{error}</small>}</div>;
  return <div className="row-actions"><button title="Approve" aria-label="Approve contribution" disabled={busy} onClick={() => review("APPROVED")} className="approve-action"><Check size={15} /></button><button title="Reject" aria-label="Reject contribution" disabled={busy} onClick={() => setRejecting(true)} className="reject-action"><X size={15} /></button>{error && <span className="inline-error">{error}</span>}</div>;
}

export default function ModulePage({ module }) {
  const config = configs[module];
  const { user } = useAuth();
  const role = normalizedRole(user);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({});
  const [refreshVersion, setRefreshVersion] = useState(0);

  const load = useCallback(async () => {
    if (!config) return;
    setBusy(true);
    setError("");
    try {
      if (module === "scheduling") {
        setRows([]);
      } else if (module === "workload" && role !== "FACULTY") {
        const [{ data: people }] = await Promise.all([api.get("/faculty")]);
        const results = await Promise.all(people.map(async (person) => {
          const { data: workloads } = await api.get("/workloads", { params: { facultyId: person.id } });
          return (workloads || []).map((item) => ({ ...item, facultyName: person.fullName }));
        }));
        setRows(results.flat());
        setFaculty(people);
      } else if (module === "performance" && role !== "FACULTY") {
        const { data: people } = await api.get("/faculty");
        const scores = await Promise.all(people.map(async (person) => {
          const { data: score } = await api.get(`/performance/${person.id}/score`);
          return { ...score, facultyName: person.fullName };
        }));
        setRows(scores);
        setFaculty(people);
      } else if (module === "performance") {
        const { data } = await api.get("/performance/me/score");
        setRows([{ ...data, facultyName: user?.fullName || user?.email }]);
      } else {
        const { data } = await api.get(config.endpoint);
        setRows(Array.isArray(data) ? data : data?.content || data?.items || data?.events || data?.contributions || data?.faculty || []);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, [config, module, role, user?.email, user?.fullName]);

  useEffect(() => {
    load();
    const refresh = () => setRefreshVersion((version) => version + 1);
    window.addEventListener("fpis-refresh", refresh);
    return () => window.removeEventListener("fpis-refresh", refresh);
  }, [load]);

  useEffect(() => {
    if (refreshVersion) load();
  }, [refreshVersion, load]);

  const openForm = async () => {
    setFormError("");
    const today = new Date();
    const year = today.getFullYear();
    if (module === "faculty") {
      try {
        const { data } = await api.get("/departments");
        setDepartments(data);
        setForm({ fullName: "", email: "", password: "", role: "FACULTY", departmentId: data[0]?.id || "" });
      } catch (requestError) {
        setFormError(getErrorMessage(requestError));
      }
    } else if (module === "workload") {
      if (!faculty.length) {
        try {
          const { data } = await api.get("/faculty");
          setFaculty(data);
          setForm({ facultyId: data[0]?.id || "", academicYear: `${year}-${year + 1}`, term: "Fall", teachingHours: 0, researchHours: 0, serviceHours: 0 });
        } catch (requestError) {
          setFormError(getErrorMessage(requestError));
        }
      } else setForm({ facultyId: faculty[0]?.id || "", academicYear: `${year}-${year + 1}`, term: "Fall", teachingHours: 0, researchHours: 0, serviceHours: 0 });
    } else {
      setForm({ title: "", category: "TEACHING", date: today.toISOString().slice(0, 10), points: "1", description: "" });
    }
    setModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (module === "faculty") {
        await api.post("/faculty", { ...form, departmentId: Number(form.departmentId) });
      } else if (module === "workload") {
        await api.put(`/workloads/${form.facultyId}`, {
          academicYear: form.academicYear,
          term: form.term,
          teachingHours: Number(form.teachingHours),
          researchHours: Number(form.researchHours),
          serviceHours: Number(form.serviceHours),
        });
      } else {
        await api.post("/contributions", { category: form.category, title: form.title, description: form.description, points: Number(form.points), occurredOn: form.date });
      }
      setModal(false);
      await load();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;
  const isFaculty = module === "faculty";
  const canCreate = module === "contributions" && ["FACULTY", "COORDINATOR"].includes(role) || isFaculty && ["ADMIN", "COORDINATOR"].includes(role) || module === "workload" && ["ADMIN", "COORDINATOR"].includes(role);
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const columns = module === "faculty" && role === "COORDINATOR" ? config.fields.filter((field) => field.key !== "role") : config.fields;

  return (
    <>
      <PageHeader eyebrow="ACADEMIC OPERATIONS" title={config.title} description={config.description} action={canCreate ? <button className="button primary" onClick={openForm}><Plus size={17} /> {module === "contributions" ? "Add contribution" : module === "faculty" ? "Add faculty" : "Assign workload"}</button> : null} />
      {module !== "scheduling" && <section className="panel data-panel">
        <div className="toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search records..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="toolbar-actions"><span className="record-count">{filtered.length} {filtered.length === 1 ? "record" : "records"}</span><button className="button subtle" disabled={busy || !filtered.length} onClick={() => exportRows(filtered, columns, `${module}-${new Date().toISOString().slice(0, 10)}.csv`)}><ArrowDownToLine size={15} /> Export CSV</button><button className="button subtle" disabled={busy} onClick={load}>{busy ? "Refreshing…" : "Refresh"}</button></div></div>
        {error && <div className="alert error" role="alert">{config.title} could not be loaded: {error}</div>}
        {busy ? <Loading label="Loading records" /> : <DataTable columns={columns} rows={filtered} empty={`No ${config.title.toLowerCase()} found.`} />}
      </section>}
      {module === "scheduling" && <SchedulingForm />}
      {module === "performance" && <PerformanceExplanation rows={rows} />}
      {modal && <div className="modal-backdrop" role="presentation"><form className="modal-card" onSubmit={submit}>
        <div className="modal-heading"><div><span className="eyebrow">{isFaculty ? "FACULTY PROFILE" : module === "workload" ? "WORKLOAD ASSIGNMENT" : "NEW SUBMISSION"}</span><h2>{isFaculty ? "Add faculty member" : module === "workload" ? "Assign workload" : "Log an activity"}</h2></div><button className="icon-button" type="button" onClick={() => setModal(false)} aria-label="Close"><X size={18} /></button></div>
        {formError && <div className="alert error" role="alert">{formError}</div>}
        {isFaculty ? <>
          <label>Full name<input required value={form.fullName || ""} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <label>Email<input type="email" required value={form.email || ""} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Temporary password<input type="password" minLength="10" required value={form.password || ""} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <div className="form-row"><label>Department<select required value={form.departmentId || ""} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Role<select value={form.role || "FACULTY"} onChange={(event) => setForm({ ...form, role: event.target.value })}>{(role === "ADMIN" ? ["FACULTY", "HOD", "DEAN", "ADMIN"] : ["FACULTY"]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
        </> : module === "workload" ? <>
          <label>Faculty member<select required value={form.facultyId || ""} onChange={(event) => setForm({ ...form, facultyId: event.target.value })}>{faculty.map((person) => <option key={person.id} value={person.id}>{person.fullName} · {person.departmentName}</option>)}</select></label>
          <div className="form-row"><label>Academic year<input required value={form.academicYear || ""} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></label><label>Term<input required value={form.term || ""} onChange={(event) => setForm({ ...form, term: event.target.value })} /></label></div>
          <div className="form-row">{["teachingHours", "researchHours", "serviceHours"].map((key) => <label key={key}>{key.replace("Hours", " hours")}<input type="number" min="0" step="0.5" required value={form[key] ?? 0} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}</div>
        </> : <>
          <label>Activity title<input required value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Category<select value={form.category || "TEACHING"} onChange={(event) => setForm({ ...form, category: event.target.value })}>{contributionCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <span className="faculty-form-note">For patents or research outputs, choose Research and include filing, grant, or publication details in the description.</span>
          <div className="form-row"><label>Date<input type="date" required value={form.date || ""} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Achievement points<input type="number" min="0.1" max="100" step="0.1" required value={form.points || ""} onChange={(event) => setForm({ ...form, points: event.target.value })} /></label></div>
          <label>Description<textarea rows="3" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        </>}
        <div className="modal-actions"><button type="button" className="button subtle" onClick={() => setModal(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : <>{isFaculty ? "Create account" : module === "workload" ? "Save assignment" : "Submit for approval"} <ArrowRight size={16} /></>}</button></div>
      </form></div>}
    </>
  );
}

function PerformanceExplanation({ rows }) {
  const score = rows.length === 1 ? rows[0] : null;
  return <section className="panel schedule-panel"><div className="panel-heading"><div><h2>How scores are calculated</h2><p>Only approved contributions count. Category points are capped at 100 before weights are applied.</p></div></div>{score && <div className="score-summary"><strong>{Number(score.score).toFixed(1)} / 100</strong><span>Overall performance score</span></div>}{score?.components?.map((item) => <div className="recommendation" key={item.category}><span className="rank">{Math.round(item.weight * 100)}%</span><div><strong>{item.category}</strong><p>{item.explanation}</p></div><span className="recommend-score">{Number(item.weightedPoints).toFixed(1)} points</span></div>)}</section>;
}

function SchedulingForm() {
  const [values, setValues] = useState({ title: "", category: "TEACHING", date: "", startTime: "09:00", endTime: "12:00" });
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scheduled, setScheduled] = useState("");

  const recommend = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setScheduled("");
    try {
      const startAt = new Date(`${values.date}T${values.startTime}`).toISOString();
      const endAt = new Date(`${values.date}T${values.endTime}`).toISOString();
      const { data } = await api.post("/calendar/recommendations", { startAt, endAt });
      setRecommendations(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };
  const schedule = async (slot) => {
    setBusy(true);
    setError("");
    try {
      await api.post("/calendar", { title: values.title, category: values.category, startAt: slot.startAt, endAt: slot.endAt, location: "" });
      setScheduled("Event added to your calendar.");
      setRecommendations([]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return <section className="panel schedule-panel"><div className="panel-heading"><div><h2>Find an open time</h2><p>Check your calendar for conflicts, then add the session to your schedule.</p></div></div><form className="schedule-form" onSubmit={recommend}><label>Session title<input required value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /></label><label>Date<input required type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} /></label><label>From<input required type="time" value={values.startTime} onChange={(event) => setValues({ ...values, startTime: event.target.value })} /></label><label>Until<input required type="time" value={values.endTime} onChange={(event) => setValues({ ...values, endTime: event.target.value })} /></label><button className="button primary" disabled={busy}>{busy ? "Checking…" : "Find available times"}</button></form>{error && <div className="alert error" role="alert">{error}</div>}{scheduled && <div className="alert success" role="status">{scheduled}</div>}{recommendations.map((slot, index) => <div className="recommendation" key={`${slot.startAt}-${index}`}><span className="rank">0{index + 1}</span><div><strong>{new Date(slot.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {new Date(slot.endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong><p>{slot.explanation}</p></div><button className="button subtle" disabled={busy} onClick={() => schedule(slot)}>Schedule session</button></div>)}</section>;
}

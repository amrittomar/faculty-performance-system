import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, KeyRound, Pencil, Plus, Save, Search, Trash2, Users, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const roleOf = (user) => String(user?.role || user?.roles?.[0] || "FACULTY").replace(/^ROLE_/i, "").toUpperCase();
const emptyFaculty = { fullName: "", email: "", password: "", departmentId: "", role: "FACULTY" };
const localInput = (value) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
const displayDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";
const displayTime = (value) => value ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";

function ScheduleEditor({ facultyId, events, onChanged, canManage }) {
  const blankForm = () => ({ title: "", date: new Date().toISOString().slice(0, 10), startTime: "09:00", endTime: "10:00", location: "" });
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const beginEdit = (event) => {
    setForm({
      title: event.title,
      date: localInput(event.startAt).slice(0, 10),
      startTime: localInput(event.startAt).slice(11),
      endTime: localInput(event.endAt).slice(11),
      location: event.location || "",
    });
    setEditingId(event.id);
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const startAt = new Date(`${form.date}T${form.startTime}`).toISOString();
      const endAt = new Date(`${form.date}T${form.endTime}`).toISOString();
      if (new Date(endAt) <= new Date(startAt)) throw new Error("Class end time must be later than its start time.");
      const request = { title: form.title, category: "TEACHING", startAt, endAt, location: form.location };
      if (editingId !== "new") await api.put(`/calendar/${editingId}`, request);
      else await api.post(`/calendar/faculty/${facultyId}`, request);
      setEditingId(null);
      setForm(blankForm());
      await onChanged();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (event) => {
    if (!window.confirm(`Remove "${event.title}" from this timetable?`)) return;
    setError("");
    try {
      await api.delete(`/calendar/${event.id}`);
      await onChanged();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="panel faculty-detail-panel">
      <div className="panel-heading">
        <div><h2>Classes & timetable</h2><p>Teaching assignments for this faculty member.</p></div>
        {canManage && !editingId && <button className="button subtle" onClick={() => { setForm(blankForm()); setError(""); setEditingId("new"); }}><CalendarPlus size={15} /> Add class</button>}
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      {canManage && editingId && <form className="schedule-editor" onSubmit={save}>
        <label>Class or subject<input required maxLength="180" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Data Structures · CSE 2A" /></label>
        <div className="form-row">
          <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Room / location<input maxLength="500" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Room or campus" /></label>
        </div>
        <div className="form-row">
          <label>Starts<input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
          <label>Ends<input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
        </div>
        <div className="modal-actions">
          <button type="button" className="button subtle" disabled={saving} onClick={() => { setEditingId(null); setError(""); }}>Cancel</button>
          <button className="button primary" disabled={saving}>{saving ? "Saving…" : editingId === "new" ? "Add to timetable" : "Save changes"}</button>
        </div>
      </form>}
      <div className="table-wrap">
        <table className="faculty-detail-table">
          <thead><tr><th>Class / subject</th><th>Date</th><th>Time</th><th>Room</th>{canManage && <th>Manage</th>}</tr></thead>
          <tbody>{events.length ? events.map((event) => <tr key={event.id}>
            <td><strong>{event.title}</strong></td>
            <td>{displayDate(event.startAt)}</td>
            <td>{displayTime(event.startAt)} – {displayTime(event.endAt)}</td>
            <td>{event.location || "—"}</td>
            {canManage && <td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${event.title}`} onClick={() => beginEdit(event)}><Pencil size={14} /></button><button className="icon-button" aria-label={`Remove ${event.title}`} onClick={() => remove(event)}><Trash2 size={14} /></button></div></td>}
          </tr>) : <tr><td className="empty-cell" colSpan={canManage ? 5 : 4}>No teaching classes are scheduled yet.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function FacultyDirectoryPage() {
  const { user } = useAuth();
  const role = roleOf(user);
  const isDepartmentHead = role === "HOD";
  const canManage = ["ADMIN", "DEAN", "HOD"].includes(role);
  const [departments, setDepartments] = useState([]);
  const [people, setPeople] = useState([]);
  const [departmentId, setDepartmentId] = useState("ALL");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [score, setScore] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailVersion, setDetailVersion] = useState(0);
  const [identity, setIdentity] = useState({ fullName: "", jobTitle: "" });
  const [password, setPassword] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyFaculty);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDirectory = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [{ data: departmentRows }, { data: facultyRows }] = await Promise.all([
        api.get("/departments"),
        api.get("/faculty"),
      ]);
      const listedFaculty = Array.isArray(facultyRows) ? facultyRows : [];
      let visibleDepartments = Array.isArray(departmentRows) ? departmentRows : [];
      if (isDepartmentHead) {
        const departmentIds = new Set(listedFaculty.map((person) => person.departmentId));
        visibleDepartments = visibleDepartments.filter((item) => departmentIds.has(item.id));
        setDepartmentId(String(listedFaculty[0]?.departmentId || ""));
      }
      setDepartments(visibleDepartments);
      setPeople(listedFaculty);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, [isDepartmentHead]);

  useEffect(() => { loadDirectory(); }, [loadDirectory]);

  const filteredPeople = useMemo(() => people.filter((person) => {
    const matchesDepartment = departmentId === "ALL" || String(person.departmentId) === String(departmentId);
    return matchesDepartment && `${person.fullName} ${person.email} ${person.departmentName} ${person.role}`.toLowerCase().includes(query.toLowerCase());
  }), [people, departmentId, query]);

  useEffect(() => {
    if (!filteredPeople.some((person) => String(person.id) === String(selectedId))) setSelectedId(String(filteredPeople[0]?.id || ""));
  }, [filteredPeople, selectedId]);

  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      setProfile(null);
      return;
    }
    setDetailBusy(true);
    setDetailError("");
    try {
      const [{ data: facultyProfile }, { data: calendar }, { data: activity }, { data: performance }] = await Promise.all([
        api.get(`/faculty/${selectedId}`),
        api.get("/calendar", { params: { facultyId: selectedId } }),
        api.get("/contributions", { params: { facultyId: selectedId } }),
        api.get(`/performance/${selectedId}/score`),
      ]);
      setProfile(facultyProfile);
      setIdentity({ fullName: facultyProfile.fullName || "", jobTitle: facultyProfile.jobTitle || "" });
      setEvents((Array.isArray(calendar) ? calendar : []).filter((item) => String(item.facultyId) === String(selectedId) && item.category === "TEACHING").sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));
      setContributions(Array.isArray(activity) ? activity : []);
      setScore(performance);
    } catch (requestError) {
      setProfile(null);
      setDetailError(getErrorMessage(requestError));
    } finally {
      setDetailBusy(false);
    }
  }, [selectedId]);

  useEffect(() => { loadDetail(); }, [loadDetail, detailVersion]);

  const reloadDetail = async () => setDetailVersion((version) => version + 1);
  const saveIdentity = async (event) => {
    event.preventDefault();
    if (!profile) return;
    setSavingIdentity(true);
    setDetailError("");
    setNotice("");
    try {
      const { data } = await api.put(`/faculty/${profile.id}`, identity);
      setProfile(data);
      setPeople((current) => current.map((person) => person.id === data.id ? { ...person, fullName: data.fullName, jobTitle: data.jobTitle } : person));
      setNotice("Faculty record updated.");
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError));
    } finally {
      setSavingIdentity(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!profile) return;
    setSavingPassword(true);
    setDetailError("");
    setNotice("");
    try {
      await api.put(`/faculty/${profile.id}/password`, { newPassword: password });
      setPassword("");
      setNotice("Password reset. The new password is stored securely and will not be displayed.");
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError));
    } finally {
      setSavingPassword(false);
    }
  };

  const openCreate = () => {
    setCreateError("");
    setCreateForm({ ...emptyFaculty, jobTitle: "", departmentId: departmentId === "ALL" ? departments[0]?.id || "" : departmentId });
    setShowCreate(true);
  };
  const createFaculty = async (event) => {
    event.preventDefault();
    setSavingCreate(true);
    setCreateError("");
    try {
      await api.post("/faculty", { ...createForm, departmentId: Number(createForm.departmentId) });
      setShowCreate(false);
      setNotice("Faculty account created.");
      await loadDirectory();
    } catch (requestError) {
      setCreateError(getErrorMessage(requestError));
    } finally {
      setSavingCreate(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="ACADEMIC OPERATIONS" title="Faculty directory" description="Browse faculty by department and review teaching schedules, profile details, and submitted progress." action={canManage && <button className="button primary" onClick={openCreate}><Plus size={16} /> Add faculty</button>} />
      {error && <div className="alert error" role="alert">Faculty records could not be loaded: {error}</div>}
      {notice && <div className="alert success" role="status">{notice}</div>}
      <div className="faculty-directory-layout">
        <section className="panel faculty-directory-list">
          <div className="panel-heading"><div><h2>Faculty members</h2><p>Select a member to view their portal record.</p></div><Users size={18} /></div>
          <label className="directory-filter-label">Department
            <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} disabled={isDepartmentHead}>
              {!isDepartmentHead && <option value="ALL">All departments</option>}
              {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="search-field faculty-directory-search"><Search size={16} /><input aria-label="Search faculty" placeholder="Search name or email…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {busy ? <Loading label="Loading faculty directory" /> : <div className="faculty-directory-items">
            {filteredPeople.map((person) => <button key={person.id} className={`faculty-directory-item ${String(person.id) === String(selectedId) ? "selected" : ""}`} onClick={() => setSelectedId(String(person.id))}>
              <span className="avatar">{person.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
              <span className="faculty-directory-person"><strong>{person.fullName}</strong><small>{person.jobTitle || "Designation not set"}</small><small>{person.departmentName} · {person.email}</small></span>
            </button>)}
            {!filteredPeople.length && <div className="faculty-feature-empty"><strong>No faculty found</strong><p>Choose another department or search term.</p></div>}
          </div>}
        </section>

        <div className="faculty-directory-detail">
          {detailBusy ? <section className="panel"><Loading label="Loading faculty record" /></section> : detailError && !profile ? <div className="alert error" role="alert">Faculty record could not be loaded: {detailError}</div> : profile && <>
            <section className="panel faculty-record-panel">
              <div className="faculty-record-heading">
                <div className="profile-identity-avatar"><Users size={24} /></div>
                <div><span className="eyebrow">FACULTY RECORD</span><h2>{profile.fullName}</h2><p>{profile.jobTitle || "Designation not set"} · {profile.departmentName}</p></div>
              </div>
              <div className="faculty-record-meta"><span>{profile.email}</span>{profile.phone && <span>{profile.phone}</span>}{profile.officeLocation && <span>{profile.officeLocation}</span>}</div>
            </section>

            {detailError && <div className="alert error" role="alert">{detailError}</div>}
            {canManage && (role !== "HOD" || profile.role === "FACULTY") && <section className="panel faculty-admin-tools">
              <form onSubmit={saveIdentity}>
                <div className="panel-heading"><div><h2>Faculty record</h2><p>Update the faculty name or designation.</p></div></div>
                <label>Name<input required maxLength="120" value={identity.fullName} onChange={(event) => setIdentity({ ...identity, fullName: event.target.value })} /></label>
                <label>Designation<input maxLength="100" value={identity.jobTitle} onChange={(event) => setIdentity({ ...identity, jobTitle: event.target.value })} placeholder="e.g. Assistant Professor" /></label>
                <button className="button primary" disabled={savingIdentity}><Save size={14} />{savingIdentity ? "Saving…" : "Save record"}</button>
              </form>
              <form onSubmit={resetPassword}>
                <div className="panel-heading"><div><h2>Reset password</h2><p>Passwords are never viewable. Set a new temporary password instead.</p></div><KeyRound size={17} /></div>
                <label>New password<input required type="password" minLength="10" maxLength="128" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                <button className="button subtle" disabled={savingPassword}><KeyRound size={14} />{savingPassword ? "Updating…" : "Reset password"}</button>
              </form>
            </section>}

            <ScheduleEditor key={profile.id} facultyId={profile.id} events={events} onChanged={reloadDetail} canManage={canManage && (role !== "HOD" || profile.role === "FACULTY")} />

            <section className="panel faculty-detail-panel">
              <div className="panel-heading"><div><h2>Progress & contributions</h2><p>Research, patents, teaching, development, and service submitted by this faculty member.</p></div></div>
              <div className="faculty-progress-stats">
                <div><small>Performance score</small><strong>{Number(score?.score || 0).toFixed(1)}<span> / 100</span></strong></div>
                <div><small>Approved activities</small><strong>{contributions.filter((item) => item.status === "APPROVED").length}</strong></div>
                <div><small>Total submissions</small><strong>{contributions.length}</strong></div>
              </div>
              <div className="table-wrap">
                <table className="faculty-detail-table">
                  <thead><tr><th>Activity / research / patent</th><th>Category</th><th>Date</th><th>Points</th><th>Status</th></tr></thead>
                  <tbody>{contributions.length ? contributions.map((item) => <tr key={item.id}>
                    <td><strong>{item.title}</strong>{item.description && <small className="faculty-activity-description">{item.description}</small>}</td>
                    <td>{item.category}</td><td>{item.occurredOn || "—"}</td><td>{item.points}</td><td><span className={`status-pill ${String(item.status || "").toLowerCase()}`}>{item.status}</span></td>
                  </tr>) : <tr><td className="empty-cell" colSpan="5">No progress has been submitted yet.</td></tr>}</tbody>
                </table>
              </div>
            </section>
          </>}
        </div>
      </div>

      {showCreate && <div className="modal-backdrop" role="presentation"><form className="modal-card" onSubmit={createFaculty}>
        <div className="modal-heading"><div><span className="eyebrow">FACULTY ACCOUNT</span><h2>Add faculty member</h2></div><button className="icon-button" type="button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18} /></button></div>
        {createError && <div className="alert error" role="alert">{createError}</div>}
        <label>Full name<input required maxLength="120" value={createForm.fullName} onChange={(event) => setCreateForm({ ...createForm, fullName: event.target.value })} /></label>
        <label>Designation<input maxLength="100" value={createForm.jobTitle || ""} onChange={(event) => setCreateForm({ ...createForm, jobTitle: event.target.value })} placeholder="e.g. Associate Professor" /></label>
        <label>Email<input required type="email" maxLength="180" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></label>
        <label>Temporary password<input required type="password" minLength="10" maxLength="128" autoComplete="new-password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} /></label>
        <div className="form-row">
          <label>Department<select required value={createForm.departmentId} onChange={(event) => setCreateForm({ ...createForm, departmentId: event.target.value })}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Role<select value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}>{(role === "ADMIN" || role === "DEAN" ? ["FACULTY", "HOD", "DEAN", "ADMIN"] : ["FACULTY"]).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        <div className="modal-actions"><button type="button" className="button subtle" onClick={() => setShowCreate(false)}>Cancel</button><button className="button primary" disabled={savingCreate}>{savingCreate ? "Creating…" : "Create account"}</button></div>
      </form></div>}
    </>
  );
}

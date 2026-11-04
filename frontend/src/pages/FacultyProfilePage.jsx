import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarClock, Download, GraduationCap, MapPin, Phone, Plus, Save, UserRound } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import api, { getErrorMessage } from "../services/api";

const emptyProfile = {
  fullName: "",
  email: "",
  role: "",
  departmentName: "",
  jobTitle: "",
  expertise: "",
  phone: "",
  officeLocation: "",
  bio: "",
};

const profileFields = Object.keys(emptyProfile);
const normalizeProfile = (profile) => Object.fromEntries(profileFields.map((field) => [field, profile?.[field] ?? ""]));
const displayDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";
const displayTime = (value) => value ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
const csvCell = (value) => {
  const text = String(value ?? "");
  const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [contributions, setContributions] = useState([]);

  const loadProfile = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [{ data: profileData }, { data: calendar }, { data: progress }] = await Promise.all([
        api.get("/faculty/me"),
        api.get("/calendar"),
        api.get("/contributions"),
      ]);
      setProfile(normalizeProfile(profileData));
      setSchedule((Array.isArray(calendar) ? calendar : []).filter((item) => item.category === "TEACHING").sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));
      setContributions(Array.isArray(progress) ? progress : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateField = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.put("/faculty/me", {
        expertise: profile.expertise,
        phone: profile.phone,
        officeLocation: profile.officeLocation,
        bio: profile.bio,
      });
      setProfile(normalizeProfile(data));
      setSuccess("Your profile has been saved.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    setError("");
    try {
      const [{ data: score }, { data: contributions }, { data: workloads }, { data: goals }, { data: reminders }] = await Promise.all([
        api.get("/performance/me/score"),
        api.get("/contributions"),
        api.get("/workloads"),
        api.get("/goals"),
        api.get("/reminders"),
      ]);
      const rows = [
        ["Faculty performance report", ""],
        ["Generated", new Date().toLocaleString()],
        ["Faculty member", profile.fullName],
        ["Email", profile.email],
        ["Department", profile.departmentName],
        ["Position", profile.jobTitle],
        ["Overall score", `${Number(score.score || 0).toFixed(1)} / 100`],
        [],
        ["Performance breakdown"],
        ["Category", "Points", "Weight", "Weighted points", "Explanation"],
        ...(score.components || []).map((item) => [item.category, item.points, `${Number(item.weight) * 100}%`, item.weightedPoints, item.explanation]),
        [],
        ["Contributions"],
        ["Title", "Category", "Date", "Points", "Status", "Description"],
        ...(contributions || []).map((item) => [item.title, item.category, item.occurredOn, item.points, item.status, item.description]),
        [],
        ["Workload"],
        ["Academic year", "Term", "Teaching hours", "Research hours", "Service hours", "Total hours"],
        ...(workloads || []).map((item) => [item.academicYear, item.term, item.teachingHours, item.researchHours, item.serviceHours, item.totalHours]),
        [],
        ["Personal goals"],
        ["Goal", "Category", "Target date", "Progress", "Description"],
        ...(goals || []).map((item) => [item.title, item.category, item.targetDate, `${item.progress}%`, item.description]),
        [],
        ["Reminders"],
        ["Reminder", "Due date", "Status", "Details"],
        ...(reminders || []).map((item) => [item.title, item.dueDate, item.completed ? "Completed" : "Open", item.details]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `faculty-performance-${profile.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report"}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(`The report could not be created: ${getErrorMessage(requestError)}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="FACULTY PORTAL"
        title="My profile"
        description="Keep your faculty profile current and take your performance snapshot with you."
        action={<button className="button primary" disabled={busy || downloading} onClick={downloadReport}><Download size={16} />{downloading ? "Preparing report…" : "Download report"}</button>}
      />
      {error && <div className="alert error" role="alert">{error}</div>}
      {success && <div className="alert success" role="status">{success}</div>}
      {busy ? <Loading label="Loading your profile" /> : error ? null : (
        <div className="profile-layout">
          <section className="panel profile-identity">
            <div className="profile-identity-avatar"><UserRound size={28} /></div>
            <span className="eyebrow">FACULTY MEMBER</span>
            <h2>{profile.fullName}</h2>
            <p>{profile.jobTitle || "Designation not set"}</p>
            <div className="profile-meta"><GraduationCap size={16} />{profile.departmentName}</div>
            {profile.officeLocation && <div className="profile-meta"><MapPin size={15} />{profile.officeLocation}</div>}
            {profile.phone && <div className="profile-meta"><Phone size={15} />{profile.phone}</div>}
            <div className="profile-email">{profile.email}</div>
          </section>
          <form className="panel profile-form" onSubmit={saveProfile}>
            <div className="panel-heading"><div><h2>Professional profile</h2><p>Name, designation, department, classes, and timetable are read-only. Update your expertise and contact details here.</p></div></div>
            <div className="faculty-readonly-fields">
              <label>Full name<input value={profile.fullName} readOnly /></label>
              <label>Designation<input value={profile.jobTitle || "Designation not set"} readOnly /></label>
              <label>Department<input value={profile.departmentName} readOnly /></label>
            </div>
            <div className="form-row">
              <label>Phone<input name="phone" maxLength="40" value={profile.phone} onChange={updateField} placeholder="Contact number" /></label>
              <label>Office location<input name="officeLocation" maxLength="160" value={profile.officeLocation} onChange={updateField} placeholder="Building, room or campus" /></label>
            </div>
            <label>Expertise areas<input name="expertise" maxLength="1000" value={profile.expertise} onChange={updateField} placeholder="e.g. Machine learning, data science" /></label>
            <label className="profile-bio-label">About<textarea name="bio" rows="5" maxLength="2000" value={profile.bio} onChange={updateField} placeholder="A short introduction to your teaching, research, and academic interests." /></label>
            <div className="profile-form-footer"><span>{profile.bio.length}/2000 characters</span><button className="button primary" disabled={saving}><Save size={15} />{saving ? "Saving…" : "Save profile"}</button></div>
          </form>
        </div>
      )}
      {!busy && !error && <>
        <section className="panel faculty-detail-panel faculty-portal-section">
          <div className="panel-heading"><div><h2><CalendarClock size={16} /> Classes & timetable</h2><p>Your teaching schedule is maintained by your department.</p></div></div>
          <div className="table-wrap">
            <table className="faculty-detail-table">
              <thead><tr><th>Class / subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead>
              <tbody>{schedule.length ? schedule.map((item) => <tr key={item.id}>
                <td><strong>{item.title}</strong></td><td>{displayDate(item.startAt)}</td><td>{displayTime(item.startAt)} – {displayTime(item.endAt)}</td><td>{item.location || "—"}</td>
              </tr>) : <tr><td className="empty-cell" colSpan="4">No teaching classes are scheduled yet.</td></tr>}</tbody>
            </table>
          </div>
        </section>
        <section className="panel faculty-detail-panel faculty-portal-section">
          <div className="panel-heading">
            <div><h2><Activity size={16} /> Progress & achievements</h2><p>Share research, patents, teaching, development, and service milestones. Submissions are reviewed by your department.</p></div>
            <Link className="button primary" to="/contributions"><Plus size={15} /> Add progress</Link>
          </div>
          <div className="table-wrap">
            <table className="faculty-detail-table">
              <thead><tr><th>Activity / research / patent</th><th>Category</th><th>Date</th><th>Points</th><th>Status</th></tr></thead>
              <tbody>{contributions.length ? contributions.map((item) => <tr key={item.id}>
                <td><strong>{item.title}</strong>{item.description && <small className="faculty-activity-description">{item.description}</small>}</td><td>{item.category}</td><td>{item.occurredOn || "—"}</td><td>{item.points}</td><td><span className={`status-pill ${String(item.status || "").toLowerCase()}`}>{item.status}</span></td>
              </tr>) : <tr><td className="empty-cell" colSpan="5">No progress submitted yet. Add a research, patent, teaching, development, or service activity to get started.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      </>}
    </>
  );
}

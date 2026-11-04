import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const categories = ["TEACHING", "FDP", "MENTORING", "EXTRA_SESSION", "RESEARCH", "ENGAGEMENT"];
const colors = { TEACHING: "lavender", FDP: "mint", MENTORING: "peach", EXTRA_SESSION: "blue", RESEARCH: "pink", ENGAGEMENT: "gray" };
const eventDate = (event) => {
  const raw = event.startAt || event.startTime || event.startDateTime || event.startDate || event.date || event.eventDate;
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? String(raw).slice(0, 10) : localDate(parsed);
};
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addMonths = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);
const normalizedRole = (user) => {
  const raw = String(user?.role || user?.roles?.[0] || "FACULTY").replace(/^ROLE_/i, "").toUpperCase();
  return raw === "HOD" ? "COORDINATOR" : raw === "DEAN" ? "ADMIN" : raw;
};
const localInput = (value) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ title: "", category: "TEACHING", date: localDate(new Date()), startTime: "09:00", endTime: "10:00", location: "" });
  const [editingId, setEditingId] = useState(null);
  const role = normalizedRole(user);
  const canManage = role === "ADMIN" || role === "COORDINATOR";
  const isFaculty = role === "FACULTY";

  const loadEvents = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get("/calendar");
      setEvents(Array.isArray(data) ? data : data?.content || data?.items || data?.events || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const visibleEvents = useMemo(() => events.filter((event) => filter === "ALL" || String(event.category || event.type || "").toUpperCase() === filter), [events, filter]);
  const eventMap = useMemo(() => visibleEvents.reduce((map, event) => {
    const key = eventDate(event);
    if (key) map.set(key, [...(map.get(key) || []), event]);
    return map;
  }, new Map()), [visibleEvents]);
  const cells = useMemo(() => {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + count) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const dayNumber = index - offset + 1;
      const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
      return { date, inMonth: dayNumber > 0 && dayNumber <= count, key: localDate(date) };
    });
  }, [month]);
  const selectedEvents = eventMap.get(selectedDate) || [];

  const submitEvent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const startAt = new Date(`${form.date}T${form.startTime}`).toISOString();
      const endAt = new Date(`${form.date}T${form.endTime}`).toISOString();
      const request = {
        title: form.title,
        category: form.category,
        startAt,
        endAt,
        location: form.location,
      };
      if (editingId) await api.put(`/calendar/${editingId}`, request);
      else await api.post("/calendar", request);
      setShowForm(false);
      setEditingId(null);
      await loadEvents();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openNewEvent = () => {
    setForm({ title: "", category: "TEACHING", date: selectedDate, startTime: "09:00", endTime: "10:00", location: "" });
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };
  const editEvent = (event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    setForm({
      title: event.title,
      category: event.category || "TEACHING",
      date: localDate(start),
      startTime: localInput(event.startAt).slice(11),
      endTime: localInput(event.endAt).slice(11),
      location: event.location || "",
    });
    setEditingId(event.id);
    setFormError("");
    setShowForm(true);
  };
  const deleteEvent = async (event) => {
    if (!window.confirm(`Delete "${event.title}" from the calendar?`)) return;
    setError("");
    try {
      await api.delete(`/calendar/${event.id}`);
      await loadEvents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <>
      <PageHeader eyebrow={isFaculty ? "FACULTY PORTAL" : "ACADEMIC OPERATIONS"} title={isFaculty ? "My timetable" : "Academic calendar"} description={isFaculty ? "View your scheduled classes and academic activities by date." : "A shared view of teaching, mentoring, FDPs, and academic events."} action={canManage && <button className="button primary" onClick={openNewEvent}><CalendarPlus size={16} /> Add event</button>} />
      {error && <div className="alert error" role="alert">Calendar events could not be loaded: {error}</div>}
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div className="month-switch"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth((date) => addMonths(date, -1))}><ArrowLeft size={16} /></button><h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><button className="icon-button" aria-label="Next month" onClick={() => setMonth((date) => addMonths(date, 1))}><ArrowRight size={16} /></button></div>
            <label className="filter-select"><span>Show</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All activities</option>{categories.map((category) => <option key={category} value={category}>{category.replaceAll("_", " ")}</option>)}</select><ChevronDown size={14} /></label>
          </div>
          {busy ? <Loading label="Loading calendar" /> : <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div className="weekday" key={day}>{day}</div>)}
            {cells.map(({ date, inMonth, key }) => {
              const dayEvents = eventMap.get(key) || [];
              const isToday = key === localDate(new Date());
              return <button type="button" className={`calendar-cell ${inMonth ? "" : "outside"} ${key === selectedDate ? "selected" : ""}`} key={key} onClick={() => setSelectedDate(key)}>
                <span className={`day-number ${isToday ? "today" : ""}`}>{date.getDate()}</span>
                <span className="day-events">{dayEvents.slice(0, 2).map((item, index) => <i className={`event-chip ${colors[String(item.category || item.type || "").toUpperCase()] || "gray"}`} key={item.id || index}>{item.title || item.name || item.category}</i>)}{dayEvents.length > 2 && <small>+{dayEvents.length - 2} more</small>}</span>
              </button>;
            })}
          </div>}
          <div className="calendar-legend">{categories.slice(0, 5).map((category) => <span key={category}><i className={colors[category]} />{category.replaceAll("_", " ")}</span>)}</div>
        </section>
        <aside className="panel agenda-panel">
          <div className="panel-heading"><div><span className="eyebrow">DAILY AGENDA</span><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2></div><span className="agenda-count">{selectedEvents.length}</span></div>
          <div className="agenda-items">
            {selectedEvents.length ? selectedEvents.map((event, index) => {
              const category = String(event.category || event.type || "").toUpperCase();
              const start = event.startAt || event.startTime || event.startDateTime;
              return <article className="agenda-item" key={event.id || index}><div className={`agenda-marker ${colors[category] || "gray"}`} /><div><strong>{event.title || event.name || "Academic event"}</strong><span>{start ? new Date(start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Time not specified"} · {(event.category || event.type || "Activity").replaceAll("_", " ")}</span>{event.facultyName && <small>{event.facultyName}</small>}{canManage && <div className="agenda-actions"><button className="button subtle" onClick={() => editEvent(event)}><Pencil size={13} /> Edit</button><button className="button danger" onClick={() => deleteEvent(event)}><Trash2 size={13} /> Delete</button></div>}</div></article>;
            }) : <div className="agenda-empty"><div className="empty-illustration"><CalendarPlus size={20} /></div><strong>No events scheduled</strong><span>Events on this day will appear here.</span></div>}
          </div>
          {canManage && <button className="button subtle add-agenda" onClick={openNewEvent}><CalendarPlus size={15} /> Create an event</button>}
        </aside>
      </div>
      {showForm && <div className="modal-backdrop" role="presentation"><form className="modal-card" onSubmit={submitEvent}><div className="modal-heading"><div><span className="eyebrow">CALENDAR EVENT</span><h2>{editingId ? "Edit academic event" : "Add academic event"}</h2></div><button className="icon-button" type="button" onClick={() => { setShowForm(false); setEditingId(null); }} aria-label="Close"><X size={18} /></button></div>{formError && <div className="alert error" role="alert">{formError}</div>}<label>Event title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label><div className="form-row"><label>Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Starts<input type="time" required value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label></div><div className="form-row"><label>Ends<input type="time" required value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label></div><div className="modal-actions"><button type="button" className="button subtle" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Save event"}</button></div></form></div>}
    </>
  );
}

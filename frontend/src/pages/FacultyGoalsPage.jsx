import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Circle, Flag, Pencil, Plus, Trash2, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import api, { getErrorMessage } from "../services/api";

const categories = ["TEACHING", "RESEARCH", "SERVICE", "DEVELOPMENT", "MENTORING"];
const emptyGoal = { title: "", description: "", category: "TEACHING", targetDate: "", progress: 0 };
const emptyReminder = { title: "", details: "", dueDate: "" };
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function FacultyGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modal, setModal] = useState("");
  const [goal, setGoal] = useState(emptyGoal);
  const [reminder, setReminder] = useState(emptyReminder);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [{ data: goalData }, { data: reminderData }] = await Promise.all([
        api.get("/goals"),
        api.get("/reminders"),
      ]);
      setGoals(goalData);
      setReminders(reminderData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openGoalForm = (item) => {
    setEditingGoal(item?.id || null);
    setGoal(item ? { title: item.title, description: item.description || "", category: item.category, targetDate: item.targetDate, progress: item.progress } : { ...emptyGoal, targetDate: today() });
    setFormError("");
    setModal("goal");
  };

  const openReminderForm = () => {
    setReminder({ ...emptyReminder, dueDate: today() });
    setFormError("");
    setModal("reminder");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (modal === "goal") {
        const request = { ...goal, progress: Number(goal.progress) };
        if (editingGoal) await api.put(`/goals/${editingGoal}`, request);
        else await api.post("/goals", request);
      } else {
        await api.post("/reminders", reminder);
      }
      setModal("");
      await load();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (item) => {
    if (!window.confirm(`Delete the goal "${item.title}"?`)) return;
    setPendingId(item.id);
    setError("");
    try {
      await api.delete(`/goals/${item.id}`);
      setGoals((current) => current.filter((entry) => entry.id !== item.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingId(null);
    }
  };

  const toggleReminder = async (item) => {
    setPendingId(item.id);
    setError("");
    try {
      const { data } = await api.patch(`/reminders/${item.id}/completion`, { completed: !item.completed });
      setReminders((current) => current.map((entry) => entry.id === item.id ? data : entry));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingId(null);
    }
  };

  const deleteReminder = async (item) => {
    setPendingId(item.id);
    setError("");
    try {
      await api.delete(`/reminders/${item.id}`);
      setReminders((current) => current.filter((entry) => entry.id !== item.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingId(null);
    }
  };

  const openReminders = reminders.filter((item) => !item.completed);
  const completedGoals = goals.filter((item) => item.progress === 100).length;

  return (
    <>
      <PageHeader eyebrow="FACULTY PORTAL" title="Goals & reminders" description="Set meaningful goals, track your progress, and stay ahead of important dates." />
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="faculty-summary-grid">
        <article className="panel faculty-summary-card"><span className="faculty-summary-icon purple"><Flag size={18} /></span><div><small>Active goals</small><strong>{goals.length - completedGoals}</strong></div></article>
        <article className="panel faculty-summary-card"><span className="faculty-summary-icon green"><CheckCircle2 size={18} /></span><div><small>Goals completed</small><strong>{completedGoals}</strong></div></article>
        <article className="panel faculty-summary-card"><span className="faculty-summary-icon orange"><Bell size={18} /></span><div><small>Open reminders</small><strong>{openReminders.length}</strong></div></article>
      </div>
      <div className="faculty-planner-grid">
        <section className="panel faculty-list-panel">
          <div className="panel-heading"><div><h2>My goals</h2><p>Build momentum through measurable progress.</p></div><button className="button primary" onClick={() => openGoalForm()}><Plus size={15} /> New goal</button></div>
          {busy ? <Loading label="Loading goals" /> : goals.length ? <div className="goal-list">{goals.map((item) => {
            const overdue = item.progress < 100 && item.targetDate < today();
            return <article className={`goal-item ${item.progress === 100 ? "completed" : ""}`} key={item.id}>
              <div className="goal-item-top"><div><span className="goal-category">{item.category}</span><h3>{item.title}</h3></div><div className="goal-item-actions"><button className="icon-button" aria-label={`Edit ${item.title}`} disabled={pendingId === item.id} onClick={() => openGoalForm(item)}><Pencil size={14} /></button><button className="icon-button" aria-label={`Delete ${item.title}`} disabled={pendingId === item.id} onClick={() => deleteGoal(item)}><Trash2 size={14} /></button></div></div>
              {item.description && <p>{item.description}</p>}
              <div className="goal-progress"><div className="goal-progress-track"><span style={{ width: `${item.progress}%` }} /></div><strong>{item.progress}%</strong></div>
              <div className="goal-item-footer"><span className={overdue ? "deadline overdue" : "deadline"}>{overdue && <AlertCircle size={13} />}{item.progress === 100 ? "Completed" : `Target · ${new Date(`${item.targetDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}</span><span>{item.progress === 100 ? "Goal achieved" : "In progress"}</span></div>
            </article>;
          })}</div> : <div className="faculty-feature-empty"><span><Flag size={20} /></span><strong>Start with one clear goal</strong><p>Break a bigger ambition into milestones and track progress here.</p><button className="button subtle" onClick={() => openGoalForm()}><Plus size={14} /> Create a goal</button></div>}
        </section>
        <section className="panel faculty-list-panel reminders-panel">
          <div className="panel-heading"><div><h2>Upcoming reminders</h2><p>Deadlines you add are saved to your faculty account.</p></div><button className="button subtle" onClick={openReminderForm}><Plus size={15} /> Add</button></div>
          {busy ? <Loading label="Loading reminders" /> : reminders.length ? <div className="reminder-list">{reminders.map((item) => {
            const overdue = !item.completed && item.dueDate < today();
            return <article className={`reminder-item ${item.completed ? "completed" : ""}`} key={item.id}>
              <button className="reminder-check" aria-label={item.completed ? `Mark ${item.title} open` : `Complete ${item.title}`} disabled={pendingId === item.id} onClick={() => toggleReminder(item)}>{item.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button>
              <div className="reminder-copy"><strong>{item.title}</strong>{item.details && <p>{item.details}</p>}<span className={overdue ? "deadline overdue" : "deadline"}>{overdue && <AlertCircle size={13} />}{item.completed ? "Completed" : `Due ${new Date(`${item.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}</span></div>
              <button className="icon-button reminder-delete" aria-label={`Delete ${item.title}`} disabled={pendingId === item.id} onClick={() => deleteReminder(item)}><Trash2 size={14} /></button>
            </article>;
          })}</div> : <div className="faculty-feature-empty reminder-empty"><span><Bell size={20} /></span><strong>Nothing slipping through</strong><p>Add a deadline or a personal reminder to keep it on your radar.</p><button className="button subtle" onClick={openReminderForm}><Plus size={14} /> Add a reminder</button></div>}
        </section>
      </div>
      {modal && <div className="modal-backdrop" role="presentation"><form className="modal-card" onSubmit={submit}>
        <div className="modal-heading"><div><span className="eyebrow">{modal === "goal" ? "PERSONAL DEVELOPMENT" : "KEEP ON TRACK"}</span><h2>{modal === "goal" ? editingGoal ? "Update your goal" : "Create a goal" : "Add a reminder"}</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={() => setModal("")}><X size={17} /></button></div>
        {formError && <div className="alert error" role="alert">{formError}</div>}
        {modal === "goal" ? <>
          <label>Goal title<input required maxLength="160" value={goal.title} onChange={(event) => setGoal({ ...goal, title: event.target.value })} placeholder="e.g. Publish a journal article" /></label>
          <div className="form-row"><label>Focus area<select value={goal.category} onChange={(event) => setGoal({ ...goal, category: event.target.value })}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Target date<input type="date" required value={goal.targetDate} onChange={(event) => setGoal({ ...goal, targetDate: event.target.value })} /></label></div>
          <label>Progress · {goal.progress}%<input type="range" min="0" max="100" step="5" value={goal.progress} onChange={(event) => setGoal({ ...goal, progress: event.target.value })} /></label>
          <label>Notes<textarea rows="3" maxLength="1000" value={goal.description} onChange={(event) => setGoal({ ...goal, description: event.target.value })} placeholder="What steps will move this forward?" /></label>
        </> : <>
          <label>Reminder title<input required maxLength="160" value={reminder.title} onChange={(event) => setReminder({ ...reminder, title: event.target.value })} placeholder="e.g. Submit semester results" /></label>
          <label>Due date<input type="date" required value={reminder.dueDate} onChange={(event) => setReminder({ ...reminder, dueDate: event.target.value })} /></label>
          <label>Notes<textarea rows="3" maxLength="1000" value={reminder.details} onChange={(event) => setReminder({ ...reminder, details: event.target.value })} placeholder="Add context or a checklist." /></label>
        </>}
        <div className="modal-actions"><button type="button" className="button subtle" onClick={() => setModal("")}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : modal === "goal" ? editingGoal ? "Save goal" : "Create goal" : "Save reminder"}</button></div>
      </form></div>}
    </>
  );
}

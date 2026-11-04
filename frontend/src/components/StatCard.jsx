export default function StatCard({ icon: Icon, label, value, note, tone = "violet" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{Icon && <Icon size={19} />}</div>
      <div className="stat-copy">
        <span className="muted">{label}</span>
        <strong>{value ?? "—"}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}

import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDuration, getMonthName } from "../utils/helpers";
import { TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";

function BarChart({ data, max, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)", height: 80 }}>
      {data.map(({ label, value }, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
            background: color,
            height: max > 0 ? `${(value / max) * 64}px` : "2px",
            minHeight: value > 0 ? 4 : 2,
            transition: "height 500ms cubic-bezier(0.16,1,0.3,1)",
          }} />
          <span style={{ fontSize: 10, color: "var(--color-text-faint)", fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Report() {
  const { lessons, students } = useApp();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Anni disponibili dai dati
  const years = useMemo(() => {
    const set = new Set(lessons.map((l) => {
      const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
      return d.getFullYear();
    }));
    set.add(now.getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [lessons]);

  // Stats mensile selezionato
  const monthLessons = useMemo(() =>
    lessons.filter((l) => {
      const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [lessons, selectedMonth, selectedYear]
  );

  const totalMese = monthLessons.reduce((s, l) => s + l.duration * l.rate, 0);
  const incassatoMese = monthLessons.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0);
  const daIncassareMese = totalMese - incassatoMese;
  const oreMese = monthLessons.reduce((s, l) => s + l.duration, 0);

  // Dati per grafico annuale (12 mesi)
  const monthlyData = useMemo(() =>
    Array.from({ length: 12 }, (_, m) => {
      const ml = lessons.filter((l) => {
        const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
        return d.getMonth() === m && d.getFullYear() === selectedYear;
      });
      return {
        label: new Intl.DateTimeFormat("it-IT", { month: "short" }).format(new Date(2000, m)),
        value: ml.reduce((s, l) => s + l.duration * l.rate, 0),
        incassato: ml.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0),
      };
    }),
    [lessons, selectedYear]
  );

  const maxMonthly = Math.max(...monthlyData.map((d) => d.value), 1);

  // Stats per studente nel mese
  const studentStats = useMemo(() =>
    students.map((s) => {
      const sl = monthLessons.filter((l) => l.studentId === s.id);
      return {
        ...s,
        ore: sl.reduce((acc, l) => acc + l.duration, 0),
        totale: sl.reduce((acc, l) => acc + l.duration * l.rate, 0),
        incassato: sl.filter((l) => l.paid).reduce((acc, l) => acc + l.duration * l.rate, 0),
        lezioni: sl.length,
      };
    }).filter((s) => s.lezioni > 0).sort((a, b) => b.totale - a.totale),
    [students, monthLessons]
  );

  // Totale annuale
  const totalAnno = monthlyData.reduce((s, m) => s + m.value, 0);
  const incassatoAnno = monthlyData.reduce((s, m) => s + m.incassato, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* Selettori */}
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
        <select className="select" style={{ width: "auto" }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{getMonthName(i)}</option>
          ))}
        </select>
      </div>

      {/* Riepilogo annuale */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: "var(--space-6)" }}>
          📊 Andamento {selectedYear}
        </h3>
        <BarChart data={monthlyData} max={maxMonthly} color="var(--color-primary)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
          <div style={{ padding: "var(--space-4)", background: "var(--color-primary-pale)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Totale anno</div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>{formatEuro(totalAnno)}</div>
          </div>
          <div style={{ padding: "var(--space-4)", background: "var(--color-success-light)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "var(--space-1)" }}>Incassato anno</div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success)" }}>{formatEuro(incassatoAnno)}</div>
          </div>
        </div>
      </div>

      {/* Riepilogo mese */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>
          📅 {getMonthName(selectedMonth).charAt(0).toUpperCase() + getMonthName(selectedMonth).slice(1)} {selectedYear}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
          {[
            { label: "Totale maturato", value: formatEuro(totalMese), color: "var(--color-text)", icon: TrendingUp },
            { label: "Incassato", value: formatEuro(incassatoMese), color: "var(--color-success)", icon: CheckCircle },
            { label: "Da incassare", value: formatEuro(daIncassareMese), color: "var(--color-error)", icon: TrendingDown },
            { label: "Ore lezioni", value: formatDuration(oreMese), color: "var(--color-secondary)", icon: Clock },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card" style={{ padding: "var(--space-4)" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--space-2)" }}>{label}</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown per studente */}
      {studentStats.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ fontWeight: 700 }}>Per studente — {getMonthName(selectedMonth)} {selectedYear}</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-offset)" }}>
                {["Studente", "Lezioni", "Ore", "Totale", "Incassato", "Da incassare"].map((h) => (
                  <th key={h} style={{
                    padding: "var(--space-2) var(--space-4)", textAlign: "left",
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentStats.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600, fontSize: "var(--text-sm)" }}>{s.nome} {s.cognome}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{s.lezioni}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{formatDuration(s.ore)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: 700 }}>{formatEuro(s.totale)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-success)", fontWeight: 600 }}>{formatEuro(s.incassato)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-error)", fontWeight: 600 }}>{formatEuro(s.totale - s.incassato)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDuration } from "../utils/helpers";
import LessonModal from "../components/LessonModal";
import { Plus, Clock, Euro, User, FileText, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";

function LessonDetailPanel({ lesson, onClose, onEdit, onDelete, onTogglePaid }) {
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 340,
      background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)",
      boxShadow: "var(--shadow-lg)", zIndex: 60,
      display: "flex", flexDirection: "column",
      animation: "slideIn 200ms cubic-bezier(0.16,1,0.3,1)",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header panel */}
      <div style={{
        padding: "var(--space-5) var(--space-6)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Dettaglio lezione</h3>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
      </div>

      {/* Contenuto */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

          {/* Studente */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "var(--radius-full)",
              background: "var(--color-primary-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: "var(--color-primary)",
            }}>
              {lesson.studentName?.charAt(0) ?? "?"}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{lesson.studentName}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Studente</div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--color-divider)" }} />

          {/* Info righe */}
          {[
            { icon: Clock, label: "Durata", value: formatDuration(lesson.duration) },
            { icon: Euro, label: "Tariffa", value: `${lesson.rate}€/h` },
            { icon: Euro, label: "Totale", value: formatEuro(lesson.duration * lesson.rate), bold: true },
          ].map(({ icon: Icon, label, value, bold }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                <Icon size={15} /> {label}
              </div>
              <span style={{ fontWeight: bold ? 700 : 500, fontSize: "var(--text-sm)", color: bold ? "var(--color-primary)" : "var(--color-text)" }}>
                {value}
              </span>
            </div>
          ))}

          {/* Note */}
          {lesson.note && (
            <div style={{
              background: "var(--color-surface-offset)", borderRadius: "var(--radius-md)",
              padding: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)", fontWeight: 600, color: "var(--color-text)" }}>
                <FileText size={13} /> Note
              </div>
              {lesson.note}
            </div>
          )}

          {/* Pagato toggle */}
          <button
            onClick={() => onTogglePaid(lesson)}
            className="btn"
            style={{
              width: "100%", justifyContent: "center",
              background: lesson.paid ? "var(--color-success-light)" : "var(--color-warning-light)",
              color: lesson.paid ? "var(--color-success)" : "var(--color-warning)",
            }}
          >
            {lesson.paid
              ? <><CheckCircle size={15} /> Pagato — clicca per annullare</>
              : <><AlertCircle size={15} /> Non pagato — clicca per segnare</>
            }
          </button>
        </div>
      </div>

      {/* Footer azioni */}
      <div style={{
        padding: "var(--space-4) var(--space-6)",
        borderTop: "1px solid var(--color-border)",
        display: "flex", gap: "var(--space-3)",
      }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => onEdit(lesson)}>
          <Pencil size={14} /> Modifica
        </button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => onDelete(lesson.id)}>
          <Trash2 size={14} /> Elimina
        </button>
      </div>
    </div>
  );
}

export default function Calendario() {
  const { lessons, addLesson, updateLesson, deleteLesson, togglePaid } = useApp();
  const calendarRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  // Converti lezioni in eventi FullCalendar
  const events = lessons.map((l) => {
    const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
    const end = new Date(d.getTime() + l.duration * 3600000);
    return {
      id: l.id,
      title: l.studentName,
      start: d,
      end,
      backgroundColor: l.paid ? "var(--color-success)" : "var(--color-primary)",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: { lesson: l },
    };
  });

  async function handleSave(data) {
    if (editLesson) await updateLesson(data);
    else await addLesson(data);
    setModalOpen(false);
    setEditLesson(null);
  }

  async function handleDelete(lessonId) {
    if (!confirm("Eliminare questa lezione?")) return;
    await deleteLesson(lessonId);
    setSelectedLesson(null);
  }

  function handleEventClick(info) {
    setSelectedLesson(info.event.extendedProps.lesson);
  }

  function handleDateClick(info) {
    setDefaultDate(info.dateStr);
    setEditLesson(null);
    setModalOpen(true);
  }

  function handleEdit(lesson) {
    setEditLesson(lesson);
    setSelectedLesson(null);
    setModalOpen(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={() => { setEditLesson(null); setModalOpen(true); }}>
          <Plus size={16} /> Nuova lezione
        </button>
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
          Non pagata
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-success)", display: "inline-block" }} />
          Pagata
        </span>
      </div>

      {/* Calendario */}
      <div className="card" style={{ padding: "var(--space-4)" }}>
        <style>{`
          .fc { font-family: var(--font-body); }
          .fc-toolbar-title { font-size: var(--text-base) !important; font-weight: 700 !important; }
          .fc-button { background: var(--color-primary) !important; border-color: var(--color-primary) !important; font-size: var(--text-xs) !important; font-family: var(--font-body) !important; }
          .fc-button:hover { background: var(--color-primary-hover) !important; border-color: var(--color-primary-hover) !important; }
          .fc-button-active { background: var(--color-primary-active) !important; }
          .fc-daygrid-day:hover { background: var(--color-primary-pale) !important; cursor: pointer; }
          .fc-event { border-radius: var(--radius-sm) !important; padding: 2px 4px !important; font-size: 11px !important; font-weight: 600 !important; }
          .fc-col-header-cell { background: var(--color-surface-offset); }
          .fc-col-header-cell-cushion { font-size: var(--text-xs) !important; font-weight: 600 !important; color: var(--color-text-muted) !important; text-decoration: none !important; }
          .fc-daygrid-day-number { color: var(--color-text-muted) !important; font-size: var(--text-xs) !important; text-decoration: none !important; }
          .fc-day-today { background: var(--color-primary-pale) !important; }
          .fc-scrollgrid { border-color: var(--color-border) !important; }
          .fc-scrollgrid td, .fc-scrollgrid th { border-color: var(--color-divider) !important; }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={itLocale}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          eventDisplay="block"
        />
      </div>

      {/* Panel dettaglio */}
      {selectedLesson && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 59 }}
            onClick={() => setSelectedLesson(null)}
          />
          <LessonDetailPanel
            lesson={selectedLesson}
            onClose={() => setSelectedLesson(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePaid={async (l) => { await togglePaid(l); setSelectedLesson(null); }}
          />
        </>
      )}

      {/* Modal aggiungi/modifica */}
      {modalOpen && (
        <LessonModal
          onClose={() => { setModalOpen(false); setEditLesson(null); }}
          onSave={handleSave}
          initial={editLesson}
        />
      )}
    </div>
  );
}
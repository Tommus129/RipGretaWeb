import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, writeBatch, Timestamp, getDocs
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── AUTH ──────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function logout() {
    await signOut(auth);
  }

  // ─── REALTIME LISTENERS (solo se autenticato) ──────────────

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "students"), (snap) => {
      const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setStudents(data);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "lessons"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setLessons(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // ─── LEZIONI ───────────────────────────────────────────────

  async function addLesson(lesson) {
    await addDoc(collection(db, "lessons"), {
      id: crypto.randomUUID(),
      studentId: lesson.studentId,
      studentName: lesson.studentName,
      date: Timestamp.fromDate(new Date(lesson.date)),
      duration: lesson.duration,
      rate: lesson.rate,
      paid: lesson.paid ?? false,
      note: lesson.note ?? "",
      extraCredit: lesson.extraCredit ?? 0,
    });
  }

  async function updateLesson(lesson) {
    const q = query(collection(db, "lessons"), where("id", "==", lesson.id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    await updateDoc(snap.docs[0].ref, {
      studentId: lesson.studentId,
      studentName: lesson.studentName,
      date: Timestamp.fromDate(new Date(lesson.date)),
      duration: lesson.duration,
      rate: lesson.rate,
      paid: lesson.paid,
      note: lesson.note ?? "",
      extraCredit: lesson.extraCredit ?? 0,
    });
  }

  async function deleteLesson(lessonId) {
    const q = query(collection(db, "lessons"), where("id", "==", lessonId));
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);
  }

  async function togglePaid(lesson) {
    const q = query(collection(db, "lessons"), where("id", "==", lesson.id));
    const snap = await getDocs(q);
    if (!snap.empty) await updateDoc(snap.docs[0].ref, { paid: !lesson.paid });
  }

  // ─── STUDENTI ──────────────────────────────────────────────

  async function addStudent(student) {
    await addDoc(collection(db, "students"), {
      id: crypto.randomUUID(),
      nome: student.nome,
      cognome: student.cognome,
      creditoResiduo: student.creditoResiduo ?? 0,
    });
  }

  async function updateStudent(student) {
    const q = query(collection(db, "students"), where("id", "==", student.id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    await updateDoc(snap.docs[0].ref, {
      nome: student.nome,
      cognome: student.cognome,
      creditoResiduo: student.creditoResiduo ?? 0,
    });
    const lq = query(collection(db, "lessons"), where("studentId", "==", student.id));
    const lsnap = await getDocs(lq);
    if (!lsnap.empty) {
      const batch = writeBatch(db);
      lsnap.docs.forEach((d) =>
        batch.update(d.ref, { studentName: `${student.nome} ${student.cognome}` })
      );
      await batch.commit();
    }
  }

  async function deleteStudent(student) {
    const q = query(collection(db, "students"), where("id", "==", student.id));
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);
    const lq = query(collection(db, "lessons"), where("studentId", "==", student.id));
    const lsnap = await getDocs(lq);
    if (!lsnap.empty) {
      const batch = writeBatch(db);
      lsnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  async function updateCredito(studentId, nuovoCredito) {
    const q = query(collection(db, "students"), where("id", "==", studentId));
    const snap = await getDocs(q);
    if (!snap.empty) await updateDoc(snap.docs[0].ref, { creditoResiduo: nuovoCredito });
  }

  // ─── STATS ─────────────────────────────────────────────────

  function getStatsForPeriod(lessonList) {
    const total = lessonList.reduce((s, l) => s + l.duration * l.rate, 0);
    const incassato = lessonList.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0);
    const daIncassare = total - incassato;
    const oreTotal = lessonList.reduce((s, l) => s + l.duration, 0);
    return { total, incassato, daIncassare, oreTotal };
  }

  function getWeeklyStats() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const filtered = lessons.filter((l) => {
      const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
    return getStatsForPeriod(filtered);
  }

  function getMonthlyStats(month, year) {
    const filtered = lessons.filter((l) => {
      const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return getStatsForPeriod(filtered);
  }

  function getStudentStats(studentId) {
    const sl = lessons.filter((l) => l.studentId === studentId);
    return getStatsForPeriod(sl);
  }

  return (
    <AppContext.Provider value={{
      // Auth
      user, authLoading, logout,
      // Dati
      lessons, students, loading,
      // Lezioni
      addLesson, updateLesson, deleteLesson, togglePaid,
      // Studenti
      addStudent, updateStudent, deleteStudent, updateCredito,
      // Stats
      getWeeklyStats, getMonthlyStats, getStudentStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
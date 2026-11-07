import { createContext, useContext, useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, writeBatch, Timestamp, getDocs, doc
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { totaleValutazione, vocePagata, incassoValutazione, chiaveVoce } from "../utils/helpers";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [evaluationCredits, setEvaluationCredits] = useState([]);
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

  // Tipi di valutazione configurati in Impostazioni
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "evaluationTypes"), (snap) => {
      const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      data.sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "it"));
      setEvaluationTypes(data);
    });
    return unsub;
  }, [user]);

  // Schede valutazione
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "evaluations"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setEvaluations(data);
    });
    return unsub;
  }, [user]);

  // Credito residuo per persona (pagamenti eccedenti le valutazioni)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "evaluationCredits"), (snap) => {
      setEvaluationCredits(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
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

  // ─── TIPI DI VALUTAZIONE (Impostazioni) ────────────────────

  async function addEvaluationType(tipo) {
    await addDoc(collection(db, "evaluationTypes"), {
      id: crypto.randomUUID(),
      nome: tipo.nome,
      prezzo: Number(tipo.prezzo) || 0,
    });
  }

  // Se propagaPrezzo e' true, il nuovo prezzo viene applicato anche a tutte
  // le schede valutazione gia' create che usano questa voce (retroattivo).
  async function updateEvaluationType(tipo, propagaPrezzo = false) {
    const q = query(collection(db, "evaluationTypes"), where("id", "==", tipo.id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const nuovoPrezzo = Number(tipo.prezzo) || 0;
    await updateDoc(snap.docs[0].ref, {
      nome: tipo.nome,
      prezzo: nuovoPrezzo,
    });

    if (propagaPrezzo) {
      const evalSnap = await getDocs(collection(db, "evaluations"));
      const daAggiornare = evalSnap.docs.filter((d) =>
        (d.data().voci ?? []).some((v) => v.typeId === tipo.id)
      );
      if (daAggiornare.length > 0) {
        const batch = writeBatch(db);
        daAggiornare.forEach((d) => {
          const voci = (d.data().voci ?? []).map((v) =>
            v.typeId === tipo.id ? { ...v, prezzo: nuovoPrezzo } : v
          );
          batch.update(d.ref, { voci });
        });
        await batch.commit();
      }
    }
  }

  // Le schede gia' salvate non vengono toccate: conservano nome e prezzo
  // della voce al momento della creazione (snapshot storico).
  async function deleteEvaluationType(tipoId) {
    const q = query(collection(db, "evaluationTypes"), where("id", "==", tipoId));
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);
  }

  // ─── SCHEDE VALUTAZIONE ────────────────────────────────────

  function normalizzaVoci(voci) {
    return (voci ?? []).map((v) => ({
      typeId: v.typeId ?? "",
      nome: v.nome ?? "",
      prezzo: Number(v.prezzo) || 0,
      paid: !!v.paid,
    }));
  }

  // La scheda risulta pagata solo se lo sono tutti i suoi test
  function tutteVociPagate(voci) {
    return voci.length > 0 && voci.every((v) => v.paid);
  }

  // Credito unico (non legato a una persona): quanto incassato in piu'
  // rispetto alle valutazioni coperte, usato per le prossime schede.
  const creditoRef = doc(db, "evaluationCredits", "generale");
  const creditoGenerale = evaluationCredits.find((c) => c.docId === "generale")?.credito ?? 0;

  // Se il credito copre per intero la nuova scheda, la segna pagata e
  // scala il credito; altrimenti il credito resta intatto.
  async function addEvaluation(valutazione) {
    const voci = normalizzaVoci(valutazione.voci);
    const totale = totaleValutazione({ voci });
    const copertaDaCredito = totale > 0 && creditoGenerale >= totale;
    const vociFinali = copertaDaCredito ? voci.map((v) => ({ ...v, paid: true })) : voci;

    const batch = writeBatch(db);
    batch.set(doc(collection(db, "evaluations")), {
      id: crypto.randomUUID(),
      nome: valutazione.nome,
      cognome: valutazione.cognome,
      date: Timestamp.fromDate(new Date(valutazione.date)),
      voci: vociFinali,
      paid: tutteVociPagate(vociFinali),
      note: valutazione.note ?? "",
    });
    if (copertaDaCredito) {
      batch.set(creditoRef, { credito: Math.round((creditoGenerale - totale) * 100) / 100 });
    }
    await batch.commit();
    return copertaDaCredito;
  }

  // Registra un pagamento sui singoli test (chiavi chiaveVoce). I test non
  // scelti restano come erano; il resto del pagamento va a credito.
  async function registraPagamento({ importo, chiavi }) {
    const scelte = new Set(chiavi);
    const coperto = evaluations.reduce(
      (s, e) => s + (e.voci ?? []).reduce(
        (t, v, i) => t + (scelte.has(chiaveVoce(e.id, i)) ? Number(v.prezzo) || 0 : 0), 0),
      0
    );
    const nuovoCredito = Math.round((creditoGenerale + importo - coperto) * 100) / 100;

    const snap = await getDocs(collection(db, "evaluations"));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      const data = d.data();
      if (!(data.voci ?? []).some((_, i) => scelte.has(chiaveVoce(data.id, i)))) return;
      const voci = (data.voci ?? []).map((v, i) => ({
        ...v,
        paid: vocePagata(data, v) || scelte.has(chiaveVoce(data.id, i)),
      }));
      batch.update(d.ref, { voci, paid: tutteVociPagate(voci) });
    });
    batch.set(creditoRef, { credito: nuovoCredito });
    await batch.commit();
  }

  async function updateEvaluation(valutazione) {
    const q = query(collection(db, "evaluations"), where("id", "==", valutazione.id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const voci = normalizzaVoci(valutazione.voci);
    await updateDoc(snap.docs[0].ref, {
      nome: valutazione.nome,
      cognome: valutazione.cognome,
      date: Timestamp.fromDate(new Date(valutazione.date)),
      voci,
      paid: tutteVociPagate(voci),
      note: valutazione.note ?? "",
    });
  }

  async function deleteEvaluation(valutazioneId) {
    const q = query(collection(db, "evaluations"), where("id", "==", valutazioneId));
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);
  }

  async function toggleEvaluationPaid(valutazione) {
    const q = query(collection(db, "evaluations"), where("id", "==", valutazione.id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    // Segna o annulla tutti i test della scheda in una volta
    const nuovo = !valutazione.paid;
    const voci = (valutazione.voci ?? []).map((v) => ({ ...v, paid: nuovo }));
    await updateDoc(snap.docs[0].ref, { voci, paid: nuovo && voci.length > 0 });
  }

  // ─── STATS ─────────────────────────────────────────────────

  function getStatsForPeriod(lessonList) {
    const total = lessonList.reduce((s, l) => s + l.duration * l.rate, 0);
    const incassato = lessonList.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0);
    const daIncassare = total - incassato;
    const oreTotal = lessonList.reduce((s, l) => s + l.duration, 0);
    return { total, incassato, daIncassare, oreTotal };
  }

  // Lunedi'-domenica della settimana corrente (usato da lezioni e valutazioni)
  function rangeSettimanaCorrente() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  }

  function getWeeklyStats() {
    const { startOfWeek, endOfWeek } = rangeSettimanaCorrente();
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

  // Stats valutazioni: il "totale" e' la somma delle voci flaggate.
  function getEvalStatsForPeriod(evalList) {
    const total = evalList.reduce((s, e) => s + totaleValutazione(e), 0);
    const incassato = evalList.reduce((s, e) => s + incassoValutazione(e), 0);
    return { total, incassato, daIncassare: total - incassato, numSchede: evalList.length };
  }

  function getWeeklyEvaluationStats() {
    const { startOfWeek, endOfWeek } = rangeSettimanaCorrente();
    const filtered = evaluations.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
    return getEvalStatsForPeriod(filtered);
  }

  function getMonthlyEvaluationStats(month, year) {
    const filtered = evaluations.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return getEvalStatsForPeriod(filtered);
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
      lessons, students, evaluations, evaluationTypes, evaluationCredits, loading,
      // Lezioni
      addLesson, updateLesson, deleteLesson, togglePaid,
      // Studenti
      addStudent, updateStudent, deleteStudent, updateCredito,
      // Tipi di valutazione
      addEvaluationType, updateEvaluationType, deleteEvaluationType,
      // Schede valutazione
      addEvaluation, updateEvaluation, deleteEvaluation, toggleEvaluationPaid,
      registraPagamento, creditoGenerale,
      // Stats
      getWeeklyStats, getMonthlyStats, getStudentStats,
      getWeeklyEvaluationStats, getMonthlyEvaluationStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
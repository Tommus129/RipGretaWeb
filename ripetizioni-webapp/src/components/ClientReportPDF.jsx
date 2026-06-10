// Template del report PDF di uno studente (libreria @react-pdf/renderer).
// Importato in lazy: la libreria entra nel bundle solo quando si esporta.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { describeFiltro } from "../utils/reportData";

// Palette allineata al brand dell'app (rosa/prugna)
const C = {
  primary: "#c2185b",
  text: "#2d1f22",
  muted: "#8a7a7e",
  border: "#ead7dd",
  offset: "#faf4f6",
  success: "#2e7d32",
  error: "#c62828",
};

const euro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n ?? 0);

const dataIt = (d) =>
  new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

function durata(h) {
  if (h === 1) return "1 ora";
  if (Number.isInteger(h)) return `${h} ore`;
  const ore = Math.floor(h);
  const min = Math.round((h - ore) * 60);
  if (ore === 0) return `${min} min`;
  return `${ore}h ${min}min`;
}

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: C.text, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 12, marginBottom: 18,
  },
  brand: { fontSize: 16, fontWeight: 700, color: C.primary },
  brandSub: { fontSize: 9, color: C.muted, marginTop: 2 },
  metaRight: { textAlign: "right", fontSize: 8, color: C.muted },
  studentBox: { marginBottom: 16 },
  studentName: { fontSize: 13, fontWeight: 700 },
  filterLine: { fontSize: 9, color: C.muted, marginTop: 3 },

  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 18 },
  rowHead: { flexDirection: "row", backgroundColor: C.offset, borderBottomWidth: 1, borderBottomColor: C.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border },
  rowLast: { flexDirection: "row" },
  th: { fontSize: 8, fontWeight: 700, color: C.muted, padding: 6, textTransform: "uppercase" },
  td: { fontSize: 9, padding: 6 },
  cData: { width: "18%" },
  cDur: { width: "16%" },
  cRate: { width: "14%" },
  cImp: { width: "16%", textAlign: "right" },
  cStato: { width: "16%" },
  cNote: { width: "20%", color: C.muted },

  paid: { color: C.success, fontWeight: 700 },
  unpaid: { color: C.error, fontWeight: 700 },

  summary: { flexDirection: "row", justifyContent: "flex-end" },
  summaryBox: { width: "55%", borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  sumLabel: { fontSize: 9, color: C.muted },
  sumValue: { fontSize: 9, fontWeight: 700 },
  sumTotalRow: {
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 4,
  },
  footer: {
    position: "absolute", bottom: 24, left: 36, right: 36,
    textAlign: "center", fontSize: 8, color: C.muted,
  },
  empty: { padding: 24, textAlign: "center", color: C.muted, fontSize: 10 },
});

export default function ClientReportPDF({ report }) {
  const { student, righe, totali, filtro, generatoIl } = report;
  const { periodo, stato } = describeFiltro(filtro);

  return (
    <Document
      title={`Report ${student.nome} ${student.cognome}`}
      author="Greta e le Ripetizioni"
    >
      <Page size="A4" style={s.page}>

        {/* Intestazione */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Greta e le Ripetizioni</Text>
            <Text style={s.brandSub}>Riepilogo lezioni</Text>
          </View>
          <View style={s.metaRight}>
            <Text>Generato il {dataIt(generatoIl)}</Text>
          </View>
        </View>

        {/* Studente + filtro */}
        <View style={s.studentBox}>
          <Text style={s.studentName}>{student.nome} {student.cognome}</Text>
          <Text style={s.filterLine}>Periodo: {periodo}  ·  {stato}</Text>
        </View>

        {/* Tabella lezioni */}
        {righe.length === 0 ? (
          <View style={s.table}>
            <Text style={s.empty}>Nessuna lezione nel periodo selezionato.</Text>
          </View>
        ) : (
          <View style={s.table}>
            <View style={s.rowHead}>
              <Text style={[s.th, s.cData]}>Data</Text>
              <Text style={[s.th, s.cDur]}>Durata</Text>
              <Text style={[s.th, s.cRate]}>Tariffa</Text>
              <Text style={[s.th, s.cImp]}>Importo</Text>
              <Text style={[s.th, s.cStato]}>Stato</Text>
              <Text style={[s.th, s.cNote]}>Note</Text>
            </View>
            {righe.map((r, i) => (
              <View key={i} style={i === righe.length - 1 ? s.rowLast : s.row} wrap={false}>
                <Text style={[s.td, s.cData]}>{dataIt(r.date)}</Text>
                <Text style={[s.td, s.cDur]}>{durata(r.duration)}</Text>
                <Text style={[s.td, s.cRate]}>{r.rate}€/h</Text>
                <Text style={[s.td, s.cImp]}>{euro(r.importo)}</Text>
                <Text style={[s.td, s.cStato]}>
                  <Text style={r.paid ? s.paid : s.unpaid}>{r.paid ? "Pagata" : "Da pagare"}</Text>
                </Text>
                <Text style={[s.td, s.cNote]}>{r.note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Riepilogo totali */}
        <View style={s.summary}>
          <View style={s.summaryBox}>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Lezioni</Text>
              <Text style={s.sumValue}>{totali.numLezioni}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Ore totali</Text>
              <Text style={s.sumValue}>{durata(totali.oreTotal)}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Incassato</Text>
              <Text style={[s.sumValue, { color: C.success }]}>{euro(totali.incassato)}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Da incassare</Text>
              <Text style={[s.sumValue, { color: C.error }]}>{euro(totali.daIncassare)}</Text>
            </View>
            <View style={s.sumTotalRow}>
              <Text style={[s.sumLabel, { fontWeight: 700, color: C.text, fontSize: 11 }]}>Totale maturato</Text>
              <Text style={[s.sumValue, { color: C.primary, fontSize: 11 }]}>{euro(totali.total)}</Text>
            </View>
          </View>
        </View>

        <Text
          style={s.footer}
          render={({ pageNumber, totalPages }) =>
            `Greta e le Ripetizioni  ·  pagina ${pageNumber} di ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

// Template PDF di una singola scheda valutazione (libreria @react-pdf/renderer).
// Importato in lazy: la libreria entra nel bundle solo quando si esporta.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

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

const toDate = (v) => (v?.toDate ? v.toDate() : new Date(v));

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: C.text, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 12, marginBottom: 18,
  },
  brand: { fontSize: 16, fontWeight: 700, color: C.primary },
  brandSub: { fontSize: 9, color: C.muted, marginTop: 2 },
  metaRight: { textAlign: "right", fontSize: 8, color: C.muted },

  personBox: { marginBottom: 16 },
  personName: { fontSize: 13, fontWeight: 700 },
  metaLine: { fontSize: 9, color: C.muted, marginTop: 3 },

  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 18 },
  rowHead: { flexDirection: "row", backgroundColor: C.offset, borderBottomWidth: 1, borderBottomColor: C.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border },
  rowLast: { flexDirection: "row" },
  th: { fontSize: 8, fontWeight: 700, color: C.muted, padding: 6, textTransform: "uppercase" },
  td: { fontSize: 9, padding: 6 },
  cVoce: { width: "78%" },
  cImp: { width: "22%", textAlign: "right" },

  summary: { flexDirection: "row", justifyContent: "flex-end" },
  summaryBox: { width: "55%", borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 10 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  sumLabel: { fontSize: 9, color: C.muted },
  sumValue: { fontSize: 9, fontWeight: 700 },
  sumTotalRow: {
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 4,
  },

  noteBox: { marginTop: 18 },
  noteLabel: { fontSize: 8, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 3 },
  noteText: { fontSize: 9, color: C.text },

  footer: {
    position: "absolute", bottom: 24, left: 36, right: 36,
    textAlign: "center", fontSize: 8, color: C.muted,
  },
  empty: { padding: 24, textAlign: "center", color: C.muted, fontSize: 10 },
});

export default function EvaluationPDF({ valutazione }) {
  const voci = valutazione.voci ?? [];
  const totale = voci.reduce((acc, v) => acc + (Number(v.prezzo) || 0), 0);

  return (
    <Document
      title={`Valutazione ${valutazione.nome} ${valutazione.cognome}`}
      author="Greta e le Ripetizioni"
    >
      <Page size="A4" style={s.page}>

        {/* Intestazione */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Greta e le Ripetizioni</Text>
            <Text style={s.brandSub}>Scheda valutazione</Text>
          </View>
          <View style={s.metaRight}>
            <Text>Generato il {dataIt(new Date())}</Text>
          </View>
        </View>

        {/* Anagrafica */}
        <View style={s.personBox}>
          <Text style={s.personName}>{valutazione.nome} {valutazione.cognome}</Text>
          <Text style={s.metaLine}>
            Data: {dataIt(toDate(valutazione.date))}  ·  Stato: {valutazione.paid ? "Pagata" : "Da pagare"}
          </Text>
        </View>

        {/* Voci */}
        {voci.length === 0 ? (
          <View style={s.table}>
            <Text style={s.empty}>Nessuna valutazione selezionata in questa scheda.</Text>
          </View>
        ) : (
          <View style={s.table}>
            <View style={s.rowHead}>
              <Text style={[s.th, s.cVoce]}>Valutazione</Text>
              <Text style={[s.th, s.cImp]}>Importo</Text>
            </View>
            {voci.map((v, i) => (
              <View key={i} style={i === voci.length - 1 ? s.rowLast : s.row} wrap={false}>
                <Text style={[s.td, s.cVoce]}>{v.nome}</Text>
                <Text style={[s.td, s.cImp]}>{euro(v.prezzo)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totale */}
        <View style={s.summary}>
          <View style={s.summaryBox}>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Voci incluse</Text>
              <Text style={s.sumValue}>{voci.length}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Stato pagamento</Text>
              <Text style={[s.sumValue, { color: valutazione.paid ? C.success : C.error }]}>
                {valutazione.paid ? "Pagata" : "Da pagare"}
              </Text>
            </View>
            <View style={s.sumTotalRow}>
              <Text style={[s.sumLabel, { fontWeight: 700, color: C.text, fontSize: 11 }]}>Totale</Text>
              <Text style={[s.sumValue, { color: C.primary, fontSize: 11 }]}>{euro(totale)}</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        {valutazione.note ? (
          <View style={s.noteBox}>
            <Text style={s.noteLabel}>Note</Text>
            <Text style={s.noteText}>{valutazione.note}</Text>
          </View>
        ) : null}

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

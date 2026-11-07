// Template PDF del report riepilogativo di più valutazioni
// (libreria @react-pdf/renderer). Mostra quali valutazioni sono state
// svolte (solo i nomi delle voci), ma mai il prezzo della singola voce:
// solo il totale per riga e i totali aggregati in fondo.
// Importato in lazy, come gli altri PDF.
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { totaleValutazione } from "../utils/helpers";

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

  titleBox: { marginBottom: 16 },
  titleText: { fontSize: 13, fontWeight: 700 },
  filterLine: { fontSize: 9, color: C.muted, marginTop: 3 },

  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 18 },
  rowHead: { flexDirection: "row", backgroundColor: C.offset, borderBottomWidth: 1, borderBottomColor: C.border },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border },
  rowLast: { flexDirection: "row" },
  th: { fontSize: 8, fontWeight: 700, color: C.muted, padding: 6, textTransform: "uppercase" },
  td: { fontSize: 9, padding: 6 },
  cNome: { width: "22%" },
  cData: { width: "12%" },
  // Una voce per riga (stringa unica con "\n"): niente View/flexWrap annidati,
  // che con @react-pdf/renderer confondono il calcolo dell'altezza e possono
  // spingere l'intera tabella su una pagina successiva lasciando vuota quella
  // prima. Il grassetto + colore brand bastano a renderle ben leggibili.
  cVoci: { width: "38%", fontWeight: 700, color: C.primary, lineHeight: 1.6 },
  cStato: { width: "13%" },
  cImp: { width: "15%", textAlign: "right" },
  vociEmpty: { fontWeight: 400, fontStyle: "italic", color: C.muted },

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

// `etichettaFiltro` descrive a parole il criterio con cui sono state scelte
// le righe (Tutte / Da pagare / Pagate / Selezione personalizzata), solo a
// scopo informativo: il PDF include comunque esattamente le valutazioni
// passate in `valutazioni`, qualunque sia la loro provenienza.
export default function EvaluationsSummaryPDF({ valutazioni, etichettaFiltro }) {
  const righe = valutazioni.map((v) => ({
    id: v.id,
    nome: `${v.nome} ${v.cognome}`,
    data: toDate(v.date),
    // Solo i nomi delle voci svolte, mai il prezzo della singola voce.
    voci: (v.voci ?? []).map((voce) => voce.nome),
    paid: !!v.paid,
    totale: totaleValutazione(v),
  }));

  const totale = righe.reduce((acc, r) => acc + r.totale, 0);
  const incassato = righe.filter((r) => r.paid).reduce((acc, r) => acc + r.totale, 0);
  const daIncassare = totale - incassato;

  return (
    <Document title="Report valutazioni" author="Greta e le Ripetizioni">
      <Page size="A4" style={s.page}>

        {/* Intestazione */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Greta e le Ripetizioni</Text>
            <Text style={s.brandSub}>Report valutazioni</Text>
          </View>
          <View style={s.metaRight}>
            <Text>Generato il {dataIt(new Date())}</Text>
          </View>
        </View>

        {/* Titolo + filtro applicato */}
        <View style={s.titleBox}>
          <Text style={s.titleText}>Riepilogo valutazioni</Text>
          <Text style={s.filterLine}>
            {etichettaFiltro}  ·  {righe.length} {righe.length === 1 ? "valutazione" : "valutazioni"}
          </Text>
        </View>

        {/* Tabella: si vedono i nomi delle voci svolte, mai il loro prezzo singolo */}
        {righe.length === 0 ? (
          <View style={s.table}>
            <Text style={s.empty}>Nessuna valutazione selezionata.</Text>
          </View>
        ) : (
          <View style={s.table}>
            <View style={s.rowHead}>
              <Text style={[s.th, s.cNome]}>Nome</Text>
              <Text style={[s.th, s.cData]}>Data</Text>
              <Text style={[s.th, s.cVoci]}>Valutazioni svolte</Text>
              <Text style={[s.th, s.cStato]}>Stato</Text>
              <Text style={[s.th, s.cImp]}>Totale</Text>
            </View>
            {righe.map((r, i) => (
              <View key={r.id ?? i} style={i === righe.length - 1 ? s.rowLast : s.row} wrap={false}>
                <Text style={[s.td, s.cNome]}>{r.nome}</Text>
                <Text style={[s.td, s.cData]}>{dataIt(r.data)}</Text>
                <Text style={[s.td, s.cVoci]}>
                  {r.voci.length === 0
                    ? <Text style={s.vociEmpty}>Nessuna voce</Text>
                    : r.voci.join("\n")}
                </Text>
                <Text style={[s.td, s.cStato]}>
                  <Text style={r.paid ? s.paid : s.unpaid}>{r.paid ? "Pagata" : "Da pagare"}</Text>
                </Text>
                <Text style={[s.td, s.cImp]}>{euro(r.totale)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totali aggregati */}
        <View style={s.summary}>
          <View style={s.summaryBox}>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Valutazioni incluse</Text>
              <Text style={s.sumValue}>{righe.length}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Incassato</Text>
              <Text style={[s.sumValue, { color: C.success }]}>{euro(incassato)}</Text>
            </View>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>Da incassare</Text>
              <Text style={[s.sumValue, { color: C.error }]}>{euro(daIncassare)}</Text>
            </View>
            <View style={s.sumTotalRow}>
              <Text style={[s.sumLabel, { fontWeight: 700, color: C.text, fontSize: 11 }]}>Totale</Text>
              <Text style={[s.sumValue, { color: C.primary, fontSize: 11 }]}>{euro(totale)}</Text>
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

export function formatEuro(amount) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount ?? 0);
  }
  
  export function formatDate(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(d);
  }
  
  export function formatDateTime(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  }
  
  export function formatDuration(hours) {
    if (hours === 1) return "1 ora";
    if (Number.isInteger(hours)) return `${hours} ore`;
    const h = Math.floor(hours);
    const min = Math.round((hours - h) * 60);
    if (h === 0) return `${min} min`;
    return `${h}h ${min}min`;
  }
  
  export function toInputDatetime(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  
  export function getMonthName(month) {
    return new Intl.DateTimeFormat("it-IT", { month: "long" }).format(new Date(2000, month, 1));
  }
  
  export function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
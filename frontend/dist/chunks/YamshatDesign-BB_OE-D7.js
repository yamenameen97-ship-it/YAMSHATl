function avatarGradient(seed = "") {
  const palette = [
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #22c55e, #14b8a6)",
    "linear-gradient(135deg, #f97316, #ef4444)",
    "linear-gradient(135deg, #f59e0b, #eab308)"
  ];
  const text = String(seed || "yamshat");
  let total = 0;
  for (const char of text) total += char.charCodeAt(0);
  return palette[total % palette.length];
}
function formatCompactNumber(value = 0) {
  const number = Number(value || 0);
  if (number >= 1e6) return `${(number / 1e6).toFixed(number >= 1e7 ? 0 : 1)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(number >= 1e4 ? 0 : 1)}K`;
  return `${number}`;
}
function formatLastSeen(value, isOnline = false) {
  if (isOnline) return "متصل الآن";
  if (!value) return "آخر ظهور غير متاح";
  try {
    const date = new Date(value);
    return `آخر ظهور ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "آخر ظهور غير متاح";
  }
}
function statusTicks(status = "sent") {
  if (status === "seen") return "✓✓";
  if (status === "delivered") return "✓✓";
  if (status === "sending") return "◌";
  return "✓";
}
function statusColor(status = "sent") {
  if (status === "seen") return "#60a5fa";
  if (status === "delivered") return "rgba(255,255,255,0.82)";
  if (status === "sending") return "rgba(255,255,255,0.5)";
  return "rgba(255,255,255,0.68)";
}
export {
  avatarGradient as a,
  formatLastSeen as b,
  statusTicks as c,
  formatCompactNumber as f,
  statusColor as s
};

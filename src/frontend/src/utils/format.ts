export function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-6)}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return "🗜️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "📊";
  if (mimeType.includes("text")) return "📃";
  return "📁";
}

export function getFileColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "bg-purple-100 text-purple-600";
  if (mimeType.startsWith("video/")) return "bg-red-100 text-red-600";
  if (mimeType.startsWith("audio/")) return "bg-green-100 text-green-600";
  if (mimeType.includes("pdf")) return "bg-orange-100 text-orange-600";
  if (mimeType.includes("zip") || mimeType.includes("tar"))
    return "bg-yellow-100 text-yellow-600";
  if (mimeType.includes("text")) return "bg-blue-100 text-blue-600";
  return "bg-muted text-muted-foreground";
}

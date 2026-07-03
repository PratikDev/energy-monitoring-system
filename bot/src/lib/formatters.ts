const DISCORD_SAFE_LIMIT = 1800;

export function formatWatts(watts: number): string {
  return `${Math.round(watts)}W`;
}

export function formatKwh(kwh: number): string {
  return `${kwh.toFixed(3)} kWh`;
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const elapsedMs = Math.max(0, now - timestamp);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 5) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  return formatTimestamp(timestamp);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function safeDiscordText(text: string): string {
  const trimmedText = text.trim();

  if (trimmedText.length <= DISCORD_SAFE_LIMIT) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, DISCORD_SAFE_LIMIT - 3).trimEnd()}...`;
}

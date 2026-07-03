import type { AlertView, RoomId } from "./dashboard-types"

const ROOM_LABELS: Record<RoomId, string> = {
	drawing: "Drawing Room",
	work1: "Work Room 1",
	work2: "Work Room 2",
}

export function formatWatts(watts: number): string {
	return `${Math.round(watts)} W`
}

export function formatKwh(kwh: number): string {
	return `${kwh.toFixed(3)} kWh`
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
	const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))

	if (elapsedSeconds < 5) {
		return "just now"
	}

	if (elapsedSeconds < 60) {
		return `${elapsedSeconds}s ago`
	}

	const elapsedMinutes = Math.floor(elapsedSeconds / 60)

	if (elapsedMinutes < 60) {
		return `${elapsedMinutes}m ago`
	}

	const elapsedHours = Math.floor(elapsedMinutes / 60)

	if (elapsedHours < 24) {
		return `${elapsedHours}h ago`
	}

	return new Date(timestamp).toLocaleString()
}

export function getRoomLabel(room: RoomId): string {
	return ROOM_LABELS[room]
}

export function getAlertTypeLabel(type: AlertView["type"]): string {
	if (type === "after_hours_on") {
		return "After hours"
	}

	return "Sustained usage"
}

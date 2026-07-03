import type { RoomId } from "./dashboard-types"

export type DevicePosition = {
	room: RoomId
	deviceName: string
	x: number
	y: number
}

export const DEVICE_POSITIONS: DevicePosition[] = [
	{ room: "drawing", deviceName: "Fan 1", x: 30, y: 28 },
	{ room: "drawing", deviceName: "Fan 2", x: 70, y: 28 },
	{ room: "drawing", deviceName: "Light 1", x: 24, y: 72 },
	{ room: "drawing", deviceName: "Light 2", x: 50, y: 72 },
	{ room: "drawing", deviceName: "Light 3", x: 76, y: 72 },
	{ room: "work1", deviceName: "Fan 1", x: 32, y: 24 },
	{ room: "work1", deviceName: "Fan 2", x: 68, y: 24 },
	{ room: "work1", deviceName: "Light 1", x: 25, y: 68 },
	{ room: "work1", deviceName: "Light 2", x: 50, y: 78 },
	{ room: "work1", deviceName: "Light 3", x: 75, y: 68 },
	{ room: "work2", deviceName: "Fan 1", x: 32, y: 24 },
	{ room: "work2", deviceName: "Fan 2", x: 68, y: 24 },
	{ room: "work2", deviceName: "Light 1", x: 25, y: 68 },
	{ room: "work2", deviceName: "Light 2", x: 50, y: 78 },
	{ room: "work2", deviceName: "Light 3", x: 75, y: 68 },
]

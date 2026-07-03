import type { RoomGroup } from "../lib/dashboard-types"
import { RoomDeviceCard } from "./RoomDeviceCard"

type DeviceStatusPanelProps = {
	rooms: RoomGroup[]
}

export function DeviceStatusPanel({ rooms }: DeviceStatusPanelProps) {
	return (
		<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{rooms.map((room) => (
				<RoomDeviceCard key={room.room} room={room} />
			))}
		</section>
	)
}

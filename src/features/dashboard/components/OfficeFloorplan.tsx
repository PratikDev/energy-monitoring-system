import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { DEVICE_POSITIONS } from "../lib/floorplan-layout"
import type { DeviceView, RoomGroup, RoomId } from "../lib/dashboard-types"
import { FloorplanDevice } from "./FloorplanDevice"

type OfficeFloorplanProps = {
	rooms: RoomGroup[]
}

function findDevice(devices: DeviceView[], room: RoomId, deviceName: string) {
	return devices.find(
		(device) => device.room === room && device.name === deviceName,
	)
}

function RoomDecor({ room }: { room: RoomId }) {
	if (room === "drawing") {
		return (
			<>
				<div className="absolute left-[34%] top-[45%] h-16 w-24 rounded-full border bg-floorplan-desk" />
				<div className="absolute left-[23%] top-[43%] size-7 rounded-md border bg-background" />
				<div className="absolute left-[63%] top-[43%] size-7 rounded-md border bg-background" />
				<div className="absolute bottom-3 left-1/2 h-2 w-20 -translate-x-1/2 rounded-full bg-border" />
			</>
		)
	}

	return (
		<>
			<div className="absolute left-[18%] top-[42%] h-12 w-24 rounded-md border bg-floorplan-desk" />
			<div className="absolute right-[18%] top-[42%] h-12 w-24 rounded-md border bg-floorplan-desk" />
			<div className="absolute left-[28%] top-[57%] size-7 rounded-md border bg-background" />
			<div className="absolute right-[28%] top-[57%] size-7 rounded-md border bg-background" />
			<div className="absolute bottom-3 left-1/2 h-2 w-20 -translate-x-1/2 rounded-full bg-border" />
		</>
	)
}

export function OfficeFloorplan({ rooms }: OfficeFloorplanProps) {
	const devices = rooms.flatMap((room) => room.devices)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Office floorplan</CardTitle>
				<CardDescription>Top-view live state</CardDescription>
			</CardHeader>
			<CardContent>
				<ScrollArea className="w-full rounded-lg border">
					<div className="min-w-[840px]">
						<div className="grid min-h-[320px] grid-cols-3 bg-muted/30">
							{rooms.map((room, index) => (
								<div
									className={cn(
										"relative overflow-hidden bg-floorplan-room p-4",
										index > 0 && "border-l border-floorplan-room-border",
									)}
									key={room.room}
								>
									<div className="absolute left-4 top-4 rounded-md border bg-background/80 px-2 py-1 text-xs font-medium">
										{room.label}
									</div>
									<RoomDecor room={room.room} />
									{DEVICE_POSITIONS.filter(
										(position) => position.room === room.room,
									).map((position) => {
										const device = findDevice(
											devices,
											position.room,
											position.deviceName,
										)

										if (!device) {
											return null
										}

										return (
											<FloorplanDevice
												device={device}
												key={`${position.room}-${position.deviceName}`}
												x={position.x}
												y={position.y}
											/>
										)
									})}
								</div>
							))}
						</div>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</CardContent>
		</Card>
	)
}

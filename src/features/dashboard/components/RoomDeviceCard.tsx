import { Fan, Lightbulb } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import {
	formatRelativeTime,
	formatWatts,
} from "../lib/dashboard-formatters"
import type { DeviceView, RoomGroup } from "../lib/dashboard-types"

type RoomDeviceCardProps = {
	room: RoomGroup
}

function DeviceIcon({ device }: { device: DeviceView }) {
	const Icon = device.type === "fan" ? Fan : Lightbulb

	return (
		<div
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
				device.status
					? "border-success/30 bg-success/10 text-success"
					: "border-border bg-muted text-muted-foreground",
			)}
		>
			<Icon />
		</div>
	)
}

export function RoomDeviceCard({ room }: RoomDeviceCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{room.label}</CardTitle>
				<CardDescription>
					{room.totalDevices} devices · {room.devicesOn} on
				</CardDescription>
				<CardAction>
					<Badge variant="outline">{formatWatts(room.totalWatts)}</Badge>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{room.devices.map((device, index) => (
					<div className="flex flex-col gap-3" key={device.id}>
						<div className="flex items-center gap-3">
							<DeviceIcon device={device} />
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-2">
									<p className="truncate text-sm font-medium">{device.name}</p>
									<Badge
										className={cn(
											device.status &&
												"bg-success text-success-foreground hover:bg-success/90",
										)}
										variant={device.status ? "default" : "secondary"}
									>
										{device.status ? "ON" : "OFF"}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground">
									{formatWatts(device.powerDrawWatts)} · changed{" "}
									{formatRelativeTime(device.lastChanged)}
								</p>
							</div>
						</div>
						{index < room.devices.length - 1 ? <Separator /> : null}
					</div>
				))}
			</CardContent>
		</Card>
	)
}

import { Fan, Lightbulb } from "lucide-react"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
	formatRelativeTime,
	formatWatts,
} from "../lib/dashboard-formatters"
import type { DeviceView } from "../lib/dashboard-types"

type FloorplanDeviceProps = {
	device: DeviceView
	x: number
	y: number
}

export function FloorplanDevice({ device, x, y }: FloorplanDeviceProps) {
	const Icon = device.type === "fan" ? Fan : Lightbulb

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					aria-label={`${device.roomLabel} ${device.name} ${
						device.status ? "on" : "off"
					}`}
					className={cn(
						"absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-floorplan-device-off text-muted-foreground shadow-sm transition-all duration-300",
						device.status &&
							device.type === "fan" &&
							"border-success/40 bg-success/15 text-success shadow-success/20",
						device.status &&
							device.type === "light" &&
							"floorplan-light-on border-warning/50 bg-warning/20 text-warning shadow-warning/20",
					)}
					style={{ left: `${x}%`, top: `${y}%` }}
					type="button"
				>
					<Icon
						className={cn(device.status && device.type === "fan" && "animate-fan-spin")}
					/>
				</button>
			</TooltipTrigger>
			<TooltipContent>
				<div className="flex flex-col gap-1">
					<span className="font-medium">
						{device.roomLabel} · {device.name}
					</span>
					<span>{device.status ? "ON" : "OFF"}</span>
					<span>{formatWatts(device.powerDrawWatts)}</span>
					<span>Changed {formatRelativeTime(device.lastChanged)}</span>
				</div>
			</TooltipContent>
		</Tooltip>
	)
}

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { formatRelativeTime, formatWatts } from "../lib/dashboard-formatters";
import type { DeviceView } from "../lib/dashboard-types";
import CeilingFan from "./floorplan/CeilingFan";
import CeilingLamp from "./floorplan/CeilingLamp";

type FloorplanDeviceProps = {
	device: DeviceView;
	x: number;
	y: number;
};

export function FloorplanDevice({ device, x, y }: FloorplanDeviceProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					aria-label={`${device.roomLabel} ${device.name} ${
						device.status ? "on" : "off"
					}`}
					className={cn(
						"absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
						device.status &&
							device.type === "light" &&
							"floorplan-light-on border-warning/50 bg-warning/20 shadow-warning/20",
					)}
					style={{ left: `${x}%`, top: `${y}%` }}
				>
					{device.type === "fan" ? (
						<CeilingFan
							className="size-20"
							spinning={device.status}
							speed={0.7}
						/>
					) : (
						<CeilingLamp
							on={device.status}
							className="size-12"
						/>
					)}
				</div>
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
	);
}

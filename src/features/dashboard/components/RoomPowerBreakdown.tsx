import { Progress } from "@/components/ui/progress"

import { formatWatts, getRoomLabel } from "../lib/dashboard-formatters"
import type { RoomId } from "../lib/dashboard-types"

type RoomPowerBreakdownProps = {
	perRoomWatts: Record<RoomId, number>
	totalWattsNow: number
}

const ROOM_ORDER: RoomId[] = ["drawing", "work1", "work2"]

export function RoomPowerBreakdown({
	perRoomWatts,
	totalWattsNow,
}: RoomPowerBreakdownProps) {
	return (
		<div className="flex flex-col gap-4">
			{ROOM_ORDER.map((room) => {
				const watts = perRoomWatts[room]
				const percent =
					totalWattsNow === 0 ? 0 : Math.round((watts / totalWattsNow) * 100)

				return (
					<div className="flex flex-col gap-2" key={room}>
						<div className="flex items-center justify-between gap-3 text-sm">
							<span className="font-medium">{getRoomLabel(room)}</span>
							<span className="text-muted-foreground">
								{formatWatts(watts)} · {percent}%
							</span>
						</div>
						<Progress value={percent} />
					</div>
				)
			})}
		</div>
	)
}

import { Activity, Gauge, Zap } from "lucide-react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

import { formatKwh, formatWatts } from "../lib/dashboard-formatters"
import type { UsageSummaryResult } from "../lib/dashboard-types"
import { RoomPowerBreakdown } from "./RoomPowerBreakdown"
import { StatTile } from "./StatTile"

type PowerSummaryPanelProps = {
	usageSummary: UsageSummaryResult
}

export function PowerSummaryPanel({ usageSummary }: PowerSummaryPanelProps) {
	return (
		<section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
			<div className="grid gap-4 sm:grid-cols-2">
				<StatTile
					description="Current office draw"
					icon={<Zap />}
					label="Power now"
					value={formatWatts(usageSummary.totalWattsNow)}
				/>
				<StatTile
					description={`${usageSummary.logPointsUsed} samples today`}
					icon={<Gauge />}
					label="Estimated usage"
					value={formatKwh(usageSummary.estimatedKwhToday)}
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity />
						Room breakdown
					</CardTitle>
					<CardDescription>Live share of current consumption</CardDescription>
				</CardHeader>
				<CardContent>
					<RoomPowerBreakdown
						perRoomWatts={usageSummary.perRoomWatts}
						totalWattsNow={usageSummary.totalWattsNow}
					/>
				</CardContent>
			</Card>
		</section>
	)
}

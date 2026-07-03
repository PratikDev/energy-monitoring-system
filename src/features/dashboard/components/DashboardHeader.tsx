import { Bell, Clock, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { formatRelativeTime, formatWatts } from "../lib/dashboard-formatters"

type DashboardHeaderProps = {
	totalWatts: number
	lastUpdated: number | null
	alertCount: number
}

export function DashboardHeader({
	totalWatts,
	lastUpdated,
	alertCount,
}: DashboardHeaderProps) {
	return (
		<header className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-normal">
					Office Energy Monitor
				</h1>
				<p className="text-sm text-muted-foreground">Live device telemetry</p>
			</div>
			<div className="flex flex-wrap gap-2">
				<Badge>
					<Zap data-icon="inline-start" />
					{formatWatts(totalWatts)}
				</Badge>
				<Badge variant={alertCount > 0 ? "destructive" : "secondary"}>
					<Bell data-icon="inline-start" />
					{alertCount} active alerts
				</Badge>
				<Badge variant="outline">
					<Clock data-icon="inline-start" />
					{lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : "Waiting"}
				</Badge>
			</div>
		</header>
	)
}

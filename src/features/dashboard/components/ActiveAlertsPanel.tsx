import { AlarmClock, CheckCircle2, Flame, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import {
	formatRelativeTime,
	getAlertTypeLabel,
} from "../lib/dashboard-formatters"
import type { AlertView } from "../lib/dashboard-types"

type ActiveAlertsPanelProps = {
	alerts: AlertView[]
}

export function ActiveAlertsPanel({ alerts }: ActiveAlertsPanelProps) {
	return (
		<Card className="lg:sticky lg:top-6">
			<CardHeader>
				<CardTitle>Active alerts</CardTitle>
				<CardDescription>{alerts.length} currently unresolved</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{alerts.length === 0 ? (
					<div className="flex flex-col items-start gap-2 rounded-lg border bg-muted/40 p-4">
						<CheckCircle2 className="text-success" />
						<div>
							<p className="font-medium">All clear</p>
							<p className="text-sm text-muted-foreground">
								Nothing needs attention right now.
							</p>
						</div>
					</div>
				) : (
					alerts.map((alert) => {
						const isSustained = alert.type === "sustained_room_usage"
						const Icon = isSustained ? Flame : TriangleAlert

						return (
							<Alert
								className={cn(
									"border-warning/40 bg-warning/10",
									isSustained && "border-destructive/40 bg-destructive/10",
								)}
								key={alert.id}
								variant={isSustained ? "destructive" : "default"}
							>
								<Icon />
								<AlertTitle className="flex flex-wrap items-center gap-2">
									{alert.roomLabel}
									<Badge variant={isSustained ? "destructive" : "outline"}>
										{getAlertTypeLabel(alert.type)}
									</Badge>
								</AlertTitle>
								<AlertDescription className="flex flex-col gap-1">
									<span>{alert.message}</span>
									<span className="inline-flex items-center gap-1 text-xs">
										<AlarmClock />
										Triggered {formatRelativeTime(alert.triggeredAt)}
									</span>
								</AlertDescription>
							</Alert>
						)
					})
				)}
			</CardContent>
		</Card>
	)
}

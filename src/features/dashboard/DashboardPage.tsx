import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ActiveAlertsPanel } from "./components/ActiveAlertsPanel"
import { DashboardHeader } from "./components/DashboardHeader"
import { DeviceStatusPanel } from "./components/DeviceStatusPanel"
import { LoadingDashboard } from "./components/LoadingDashboard"
import { OfficeFloorplan } from "./components/OfficeFloorplan"
import { PowerSummaryPanel } from "./components/PowerSummaryPanel"
import { useDashboardData } from "./hooks/useDashboardData"

function DashboardErrorState({ message }: { message: string }) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-6">
			<Alert className="max-w-lg">
				<AlertTitle>Unable to load live office data.</AlertTitle>
				<AlertDescription>{message}</AlertDescription>
			</Alert>
		</main>
	)
}

export function DashboardPage() {
	const data = useDashboardData()

	if (data.status === "loading") {
		return <LoadingDashboard />
	}

	if (data.status === "error") {
		return <DashboardErrorState message={data.message} />
	}

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 p-4 sm:p-6">
				<DashboardHeader
					alertCount={data.activeAlerts.count}
					lastUpdated={data.allDevices.lastUpdated}
					totalWatts={data.usageSummary.totalWattsNow}
				/>
				<div className="grid gap-5 lg:grid-cols-12">
					<div className="flex flex-col gap-5 lg:col-span-8">
						<PowerSummaryPanel usageSummary={data.usageSummary} />
						<OfficeFloorplan rooms={data.allDevices.rooms} />
						<DeviceStatusPanel rooms={data.allDevices.rooms} />
					</div>
					<div className="lg:col-span-4">
						<ActiveAlertsPanel alerts={data.activeAlerts.alerts} />
					</div>
				</div>
			</div>
		</main>
	)
}

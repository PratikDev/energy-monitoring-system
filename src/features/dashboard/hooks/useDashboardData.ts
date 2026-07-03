import { useQuery } from "convex/react"

import { api } from "../../../../convex/_generated/api"
import type {
	ActiveAlertsResult,
	AllDevicesResult,
	UsageSummaryResult,
} from "../lib/dashboard-types"

type DashboardDataState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| {
			status: "ready"
			allDevices: AllDevicesResult
			usageSummary: UsageSummaryResult
			activeAlerts: ActiveAlertsResult
	  }

export function useDashboardData(): DashboardDataState {
	const allDevices = useQuery(api.office.getAllDevices)
	const usageSummary = useQuery(api.office.getUsageSummary)
	const activeAlerts = useQuery(api.office.getActiveAlerts)

	if (allDevices === undefined || usageSummary === undefined || activeAlerts === undefined) {
		return { status: "loading" }
	}

	if (allDevices === null || usageSummary === null || activeAlerts === null) {
		return {
			status: "error",
			message: "Unable to load live office data.",
		}
	}

	return {
		status: "ready",
		allDevices,
		usageSummary,
		activeAlerts,
	}
}

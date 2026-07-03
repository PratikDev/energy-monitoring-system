import type { FunctionReturnType } from "convex/server"

import { api } from "../../../../convex/_generated/api"

export type AllDevicesResult = FunctionReturnType<
	typeof api.office.getAllDevices
>
export type UsageSummaryResult = FunctionReturnType<
	typeof api.office.getUsageSummary
>
export type ActiveAlertsResult = FunctionReturnType<
	typeof api.office.getActiveAlerts
>
export type RoomGroup = AllDevicesResult["rooms"][number]
export type DeviceView = RoomGroup["devices"][number]
export type AlertView = ActiveAlertsResult["alerts"][number]

export type DeviceKind = "fan" | "light"
export type RoomId = "drawing" | "work1" | "work2"

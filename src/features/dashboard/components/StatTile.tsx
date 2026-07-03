import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatTileProps = {
	label: string
	value: string
	description?: string
	icon?: ReactNode
	className?: string
}

export function StatTile({
	label,
	value,
	description,
	icon,
	className,
}: StatTileProps) {
	return (
		<Card className={cn("min-h-28", className)} size="sm">
			<CardContent className="flex h-full items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col gap-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="text-2xl font-semibold tracking-normal">{value}</p>
					{description ? (
						<p className="text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
				{icon ? (
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
						{icon}
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}

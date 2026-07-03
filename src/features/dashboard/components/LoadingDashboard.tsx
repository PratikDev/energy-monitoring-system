import { Skeleton } from "@/components/ui/skeleton"

export function LoadingDashboard() {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 p-4 sm:p-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-40" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-7 w-24" />
						<Skeleton className="h-7 w-28" />
					</div>
				</div>
				<div className="grid gap-5 lg:grid-cols-12">
					<div className="flex flex-col gap-5 lg:col-span-8">
						<Skeleton className="h-48 w-full" />
						<Skeleton className="h-[380px] w-full" />
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<Skeleton className="h-64 w-full" />
							<Skeleton className="h-64 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					</div>
					<div className="lg:col-span-4">
						<Skeleton className="h-96 w-full" />
					</div>
				</div>
			</div>
		</main>
	)
}

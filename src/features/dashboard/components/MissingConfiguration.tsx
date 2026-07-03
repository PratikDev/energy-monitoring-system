import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

export function MissingConfiguration() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Configuration required</CardTitle>
					<CardDescription>
						The dashboard needs a Convex deployment URL before it can load
						live office data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert>
						<AlertTitle>Missing VITE_CONVEX_URL</AlertTitle>
						<AlertDescription>
							Add it to your environment and restart the dev server.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</main>
	)
}

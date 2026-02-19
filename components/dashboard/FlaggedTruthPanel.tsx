import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface FlaggedEvent {
  id: string;
  source: string;
  message: string;
  createdAt: string;
}

export function FlaggedTruthPanel({ events }: { events: FlaggedEvent[] }) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Truth Mode Flags
        </CardTitle>
        <CardDescription>
          Edits, overrides, and suspicious spikes are shown here without filtering.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.length ? (
          events.map((event) => (
            <article key={event.id} className="rounded-md border border-destructive/30 p-3 text-sm">
              <p className="font-semibold">{event.source}</p>
              <p>{event.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.createdAt}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No flagged events in the current window.</p>
        )}
      </CardContent>
    </Card>
  );
}

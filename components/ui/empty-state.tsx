import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="space-y-3 py-10 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

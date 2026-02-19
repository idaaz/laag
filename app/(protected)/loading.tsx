import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedLoading() {
  return (
    <div className="h-full p-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}

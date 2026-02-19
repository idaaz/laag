"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BarChart3, ExternalLink, Globe, Search, Target, TrendingUp } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { InsightCard } from "@/components/analytics/InsightCard";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";

const PAGE_SIZE = 10;

export default function TrackingPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [page, setPage] = useState(1);
  const { visitedUrlsQuery, analyticsQuery } = useTracking(userId, page, PAGE_SIZE);
  const [search, setSearch] = useState("");

  const urls = useMemo(() => visitedUrlsQuery.data?.data ?? [], [visitedUrlsQuery.data]);
  const totalCount = visitedUrlsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filteredUrls = useMemo(
    () =>
      urls.filter(
        (row) =>
          row.url.toLowerCase().includes(search.toLowerCase()) ||
          row.title?.toLowerCase().includes(search.toLowerCase())
      ),
    [urls, search]
  );

  // Analytics insights from RPC
  const analytics = analyticsQuery.data;

  const showLoading = authLoading || visitedUrlsQuery.isLoading;

  return (
    <PageFrame
      header={
        <SectionHeader
          title="Tracking"
          description="Monitor browser flow."
          icon={<Globe className="h-5 w-5" />}
          actions={
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          }
        />
      }
    >
      {/* Insights Section */}
      {analytics && !analyticsQuery.isLoading && (
        <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Insights (Last 30 Days)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightCard
              title="Focus Score"
              value={`${analytics.focusScore}%`}
              subtitle="Education + Work vs Others"
              icon={Target}
              tone="score"
            />
            <InsightCard
              title="Total Visits"
              value={analytics.totalVisits}
              subtitle={`${analytics.uniqueDomains} unique domains`}
              icon={Globe}
              tone="info"
            />
            <InsightCard
              title="Top Category"
              value={analytics.categories[0]?.category || "N/A"}
              subtitle={`${Math.round(analytics.categories[0]?.percentage || 0)}% of visits`}
              icon={TrendingUp}
              tone="info"
            />
          </div>

          {/* Top Domains */}
          {analytics.topDomains.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Top Domains</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {analytics.topDomains.slice(0, 5).map((stat) => (
                  <div
                    key={stat.domain}
                    className="rounded-lg border border-border/60 bg-background/40 p-2 text-center"
                  >
                    <p className="text-xs font-medium truncate" title={stat.domain}>
                      {stat.domain}
                    </p>
                    <p className="text-lg font-semibold mt-1 tabular-nums text-[var(--k-blue)]">{stat.count}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.round(stat.percentage)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {analytics.categories.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.category}: {cat.count} ({Math.round(cat.percentage)}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* URL List */}
      <div className="col-span-full rounded-xl border border-border/80 bg-card/85 min-h-[360px] overflow-hidden flex flex-col">
        {showLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <Skeleton key={row} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : filteredUrls.length > 0 ? (
          <>
            <div className="flex-1 overflow-auto laag-scroll">
              <div className="divide-y divide-border/40 md:hidden">
                {filteredUrls.map((entry) => (
                  <article key={entry.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium" title={entry.title || "Untitled"}>
                        {entry.title || "Untitled"}
                      </p>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-border p-1.5 hover:bg-secondary hover:border-border/80 transition-colors"
                        aria-label="Open"
                        title="Open"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground" title={entry.url}>
                      {entry.url}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {format(new Date(entry.visited_at), "MMM d, HH:mm")}
                    </p>
                  </article>
                ))}
              </div>

              <table className="hidden w-full text-left text-sm md:table">
                <thead className="sticky top-0 z-10 bg-secondary/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="w-1/3 px-3 py-2 font-medium">URL</th>
                    <th className="w-36 px-3 py-2 text-right font-medium">Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUrls.map((entry) => (
                    <tr key={entry.id} className="group transition-colors hover:bg-secondary/50">
                      <td className="max-w-[220px] truncate px-3 py-2 font-medium" title={entry.title || "Untitled"}>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-primary/70" />
                          <span className="truncate">{entry.title || "Untitled"}</span>
                        </div>
                      </td>
                      <td className="max-w-[240px] truncate px-3 py-2 text-muted-foreground" title={entry.url}>
                        <div className="flex items-center gap-1">
                          <span className="truncate">{entry.url}</span>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                            aria-label="Open"
                            title="Open"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {format(new Date(entry.visited_at), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isLoading={visitedUrlsQuery.isFetching}
              itemCount={filteredUrls.length}
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <EmptyState
              title={search ? "No matches" : "No history"}
              description={search ? "Try another term." : "Visit sites to track."}
            />
          </div>
        )}
      </div>
    </PageFrame>
  );
}

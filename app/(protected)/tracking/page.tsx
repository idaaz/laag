"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { BarChart3, ExternalLink, Globe, Search, Target, TrendingUp, LayoutPanelLeft } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { InsightCard } from "@/components/analytics/InsightCard";
import { TrackingCategoriesPieChart } from "@/components/analytics/TrackingCategoriesPieChart";
import { IframeViewer } from "@/components/tracking/IframeViewer";
import { ManageCategoriesDialog } from "@/components/tracking/ManageCategoriesDialog";
import { AssignDomainDialog } from "@/components/tracking/AssignDomainDialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";

const PAGE_SIZE = 10;

import { useSearchParams } from "next/navigation";

export default function TrackingPage() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [analyticsLimit, setAnalyticsLimit] = useState(10);
  const { visitedUrlsQuery, analyticsQuery, logInAppVisit } = useTracking(userId, page, PAGE_SIZE, analyticsLimit);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 24]);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [domainToAssign, setDomainToAssign] = useState<string | null>(null);

  // Sync search with URL for in-tab search
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearch(q);
  }, [searchParams]);

  function handlePreviewUrl(url: string, title: string | null) {
    setSelectedUrl(url);
    logInAppVisit.mutate({ url, title: title || "In-App Preview" });
  }

  const urls = useMemo(() => visitedUrlsQuery.data?.data ?? [], [visitedUrlsQuery.data]);
  const totalCount = visitedUrlsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Analytics insights from RPC
  const analytics = analyticsQuery.data;

  // Domain Categorization Logic for "Other" and filtering
  const filteredUrls = useMemo(
    () =>
      urls.filter((row) => {
        const matchesSearch = row.url.toLowerCase().includes(search.toLowerCase()) ||
          row.title?.toLowerCase().includes(search.toLowerCase());

        const visitHour = new Date(row.visited_at).getHours();
        const matchesTime = visitHour >= timeRange[0] && visitHour <= timeRange[1];

        // Simple category matching logic for local filtering
        let category = "Other";
        const url = row.url.toLowerCase();
        if (row.is_in_app) category = "In-App Tracking";
        else if (url.match(/udemy|coursera|edx|khan|stackoverflow|github|documentation|docs|tutorial|learning/)) category = "Education";
        else if (url.match(/gmail|outlook|slack|teams|jira|asana|notion|linear|figma|vercel/)) category = "Work";
        else if (url.match(/facebook|twitter|instagram|reddit|linkedin|tiktok|snapchat|whatsapp/)) category = "Social";
        else if (url.match(/youtube|netflix|spotify|twitch|gaming|hulu|prime|disney/)) category = "Entertainment";
        else if (url.match(/news|bbc|cnn|nytimes|guardian|reuters|medium|blog/)) category = "News";

        const matchesCategory = !selectedCategory || category === selectedCategory;

        return matchesSearch && matchesTime && matchesCategory;
      }),
    [urls, search, timeRange, selectedCategory]
  );

  const mobileKPIs = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: "Focus", value: `${analytics.focusScore}%`, color: "score" as const },
      { label: "Visits", value: analytics.totalVisits, color: "info" as const },
      { label: "Unique", value: analytics.uniqueDomains, color: "focus" as const },
      { label: "Top Cat", value: analytics.categories[0]?.category || "N/A", color: "achievement" as const }
    ];
  }, [analytics]);

  useRegisterKPIs(mobileKPIs);

  const showLoading = authLoading || visitedUrlsQuery.isLoading;

  return (
    <PageFrame
      header={
        <SectionHeader
          title="Tracking"
          description="Monitor browser flow."
          icon={<Globe className="h-5 w-5" />}
          actions={
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={analyticsLimit.toString()} onValueChange={(v) => setAnalyticsLimit(parseInt(v))}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground">Top Domains</h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Limit: {analyticsLimit}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analytics.topDomains.map((stat) => (
                  <button
                    key={stat.domain}
                    className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-background/40 p-2 min-w-[100px] hover:bg-secondary cursor-pointer transition-all hover:scale-105 active:scale-95"
                    onClick={() => setDomainToAssign(stat.domain)}
                    title={`Assign category to ${stat.domain}`}
                  >
                    <p className="text-[10px] font-medium truncate w-full text-center text-muted-foreground">
                      {stat.domain}
                    </p>
                    <p className="text-lg font-bold mt-1 tabular-nums text-primary">{stat.count}</p>
                    <p className="text-[9px] font-mono text-muted-foreground/70">
                      {Math.round(stat.percentage)}%
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Pie Chart */}
          {analytics.categories.length > 0 && (
            <div className="mt-6 md:grid md:grid-cols-2 md:gap-4 items-center">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-muted-foreground text-center w-full">Category Breakdown</h3>
                </div>
                <div className="h-[250px]">
                  <TrackingCategoriesPieChart data={analytics.categories} onCategoryClick={(cat) => setSelectedCategory(selectedCategory === cat ? null : cat)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0 content-center justify-center">
                {analytics.categories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105",
                      selectedCategory === cat.category
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/40 border-border/60 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: selectedCategory === cat.category ? "currentColor" : cat.color }}
                    />
                    {cat.category}: {Math.round(cat.percentage)}%
                  </button>
                ))}
                {selectedCategory && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="h-7 text-[10px] uppercase">Clear Filter</Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 border border-border/40 ml-2"
                  onClick={() => setIsManageCategoriesOpen(true)}
                >
                  Manage Categories
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Filters (Slider) */}
      <div className="col-span-full rounded-xl border border-border/80 bg-card/85 p-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 space-y-2 max-w-md">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Filter by Hour of Day</span>
            <span>{timeRange[0]}:00 - {timeRange[1]}:00</span>
          </div>
          <Slider
            min={0}
            max={24}
            step={1}
            value={[timeRange[0], timeRange[1]]}
            onValueChange={(val) => setTimeRange([val[0], val[1]] as [number, number])}
            className="w-full"
          />
        </div>
      </div>

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
                  <article
                    key={entry.id}
                    className="p-3 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => handlePreviewUrl(entry.url, entry.title)}
                      >
                        <p className="truncate text-sm font-medium" title={entry.title || "Untitled"}>
                          {entry.title || "Untitled"}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground" title={entry.url}>
                          {entry.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md border border-border bg-background/50"
                          onClick={() => handlePreviewUrl(entry.url, entry.title)}
                          title="Open in Popup"
                        >
                          <LayoutPanelLeft className="h-3.5 w-3.5" />
                        </Button>
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/50 hover:bg-secondary hover:border-border/80 transition-colors"
                          aria-label="Open in new tab"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
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
                    <tr
                      key={entry.id}
                      className="group transition-colors hover:bg-secondary/50"
                    >
                      <td
                        className="max-w-[220px] truncate px-3 py-2 font-medium cursor-pointer"
                        onClick={() => handlePreviewUrl(entry.url, entry.title)}
                        title={entry.title || "Untitled"}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-primary/70" />
                          <span className="truncate">{entry.title || "Untitled"}</span>
                        </div>
                      </td>
                      <td className="max-w-[240px] truncate px-3 py-2 text-muted-foreground" title={entry.url}>
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1">{entry.url}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handlePreviewUrl(entry.url, entry.title)}
                              title="Open in Popup"
                            >
                              <LayoutPanelLeft className="h-3.5 w-3.5" />
                            </Button>
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 transition-colors hover:text-primary"
                              aria-label="Open in new tab"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
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

      <IframeViewer url={selectedUrl} onClose={() => setSelectedUrl(null)} />

      <ManageCategoriesDialog
        open={isManageCategoriesOpen}
        onOpenChange={setIsManageCategoriesOpen}
      />

      <AssignDomainDialog
        domain={domainToAssign}
        open={!!domainToAssign}
        onOpenChange={(open) => {
          if (!open) setDomainToAssign(null);
        }}
      />
    </PageFrame >
  );
}

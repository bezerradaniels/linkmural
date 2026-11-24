import { AdminFunnelAreaCard } from "@/components/admin/AdminFunnelAreaCard";
import { AdminHorizontalRankCard } from "@/components/admin/AdminHorizontalRankCard";
import { AdminInsightsCard } from "@/components/admin/AdminInsightsCard";
import { AdminKpiSparkCard } from "@/components/admin/AdminKpiSparkCard";
import { AdminPerformanceListCard } from "@/components/admin/AdminPerformanceListCard";
import { AdminTrendLinesCard } from "@/components/admin/AdminTrendLinesCard";
import {
  getAdminDashboardData,
  parseAdminDateRange,
} from "@/lib/admin/dashboard-data";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const params = await searchParams;
  const range = parseAdminDateRange(params);
  const data = await getAdminDashboardData(range);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Page Title */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#101828]">
          Visão geral
        </h1>
        <p className="mt-0.5 text-[15px] font-medium text-[#667085]">
          Analise a ativação, receita e engajamento do Linkmural em{" "}
          <span className="font-semibold text-[#344054]">
            {data.range.rangeLabel.toLowerCase()}
          </span>
          .
        </p>
      </div>

      {/* Row 1: 5 KPI Sparkline Cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {data.kpis.map((kpi) => (
          <AdminKpiSparkCard key={kpi.id} item={kpi} />
        ))}
      </div>

      {/* Row 2: Hero Funnel + Performance / Base List */}
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <AdminFunnelAreaCard
          steps={data.funnel.steps}
          rangeLabel={data.range.rangeLabel}
          overallConversionPct={data.funnel.overallConversionPct}
          totalDropOffs={data.funnel.totalDropOffs}
          biggestDropLabel={data.funnel.biggestDropLabel}
          opportunityStep={data.funnel.opportunityStep}
        />

        <AdminPerformanceListCard rows={data.performanceRows} />
      </div>

      {/* Row 3: Trend Lines + Insights + Devices/Sources */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <AdminTrendLinesCard series={data.dailySeries} />

        <AdminInsightsCard insights={data.insights} />

        <AdminHorizontalRankCard
          devices={data.deviceBreakdown}
          sources={data.sourceBreakdown}
          totalViews={data.totals.viewsInRange}
        />
      </div>
    </div>
  );
}

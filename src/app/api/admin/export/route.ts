import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminDashboardData,
  parseAdminDateRange,
} from "@/lib/admin/dashboard-data";
import { requireAdmin } from "@/lib/auth";

function csvCell(value: string | number): string {
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const { searchParams } = request.nextUrl;
  const range = parseAdminDateRange({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    preset: searchParams.get("preset") ?? undefined,
  });

  const data = await getAdminDashboardData(range);
  const lines: string[] = [];

  lines.push(["Seção", "Métrica / Data", "Valor", "Detalhe"].map(csvCell).join(","));

  for (const kpi of data.kpis) {
    lines.push(
      ["KPIs", kpi.label, kpi.value, `${kpi.deltaPct ?? 0}% ${kpi.compareLabel}`]
        .map(csvCell)
        .join(","),
    );
  }

  for (const step of data.funnel.steps) {
    lines.push(
      ["Funil", step.label, step.count, `${step.pctOfTop}%`]
        .map(csvCell)
        .join(","),
    );
  }

  for (const row of data.performanceRows) {
    lines.push(
      ["Resumo", row.label, row.metric, row.sublabel].map(csvCell).join(","),
    );
  }

  for (const d of data.dailySeries) {
    lines.push(
      [
        "Diário",
        d.date,
        `Views: ${d.views} | Cliques: ${d.clicks}`,
        `Cadastros: ${d.signups} | Publicações: ${d.published}`,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  const csv = `\uFEFF${lines.join("\n")}`;
  const filename = `linkmural-admin-${range.fromKey}_a_${range.toKey}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export interface MonthlyRevenue {
  month: string;
  basic?: number;
  premium?: number;
  custom?: number;
}

interface RevenueTotals {
  basic: number;
  premium: number;
  custom: number;
}

export const generateSummary = (
  monthlyData: MonthlyRevenue[] | undefined,
  revenueTotals?: RevenueTotals,
): string => {
  if (!monthlyData || monthlyData.length === 0) {
    return "No analytics data available.";
  }

  const safeTotals = revenueTotals ?? { basic: 0, premium: 0, custom: 0 };
  const totalRevenue = safeTotals.basic + safeTotals.premium + safeTotals.custom;
  const highestCategory = Object.entries(safeTotals).sort((a, b) => b[1] - a[1])[0] ?? ["None", 0];
  const highestCategoryName = highestCategory[0];
  const last = monthlyData.at(-1);
  const previous = monthlyData.at(-2);
  const lastTotal = last ? (last.basic ?? 0) + (last.premium ?? 0) + (last.custom ?? 0) : 0;
  const previousTotal = previous
    ? (previous.basic ?? 0) + (previous.premium ?? 0) + (previous.custom ?? 0)
    : 0;
  const growthRate = previousTotal === 0 ? 0 : ((lastTotal - previousTotal) / previousTotal) * 100;

  let bestMonth = "N/A";
  let bestMonthValue = 0;
  for (const datum of monthlyData) {
    const monthlyTotal = (datum.basic ?? 0) + (datum.premium ?? 0) + (datum.custom ?? 0);
    if (monthlyTotal > bestMonthValue) {
      bestMonthValue = monthlyTotal;
      bestMonth = datum.month;
    }
  }

  const trend =
    growthRate > 5
      ? "strong upward growth"
      : growthRate > 0
        ? "slight positive improvement"
        : growthRate < 0
          ? "a decline in performance"
          : "stable performance";

  return `Overall revenue collection stands at Rs. ${totalRevenue.toLocaleString()}.
  The highest contributing plan is ${highestCategoryName.toUpperCase()}.
  The latest month (${last?.month ?? "N/A"}) recorded a total of Rs. ${lastTotal.toLocaleString()}, showing ${trend} (${growthRate.toFixed(1)}% compared to the previous month).
  The best performing month so far is ${bestMonth}, with a peak revenue of Rs. ${bestMonthValue.toLocaleString()}.`;
};

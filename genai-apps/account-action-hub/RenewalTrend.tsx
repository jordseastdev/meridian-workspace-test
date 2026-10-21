import type { Filter } from "@meridian/app";
import { useRows } from "@meridian/app";
import { LineChart } from "@meridian/ui";

type Props = { filters: Filter<"account_base">[] };

export function RenewalTrend({ filters }: Props) {
  const trend = useRows("account_base", {
    filters: [...filters, { column: "renewal", min: "1900-01-01" }],
    groupBy: "renewal",
    sort: [{ column: "renewal", direction: "desc" }],
    limit: 1000,
  });

  const data = [...trend.rows].reverse();

  return (
    <section className="trend-panel" aria-label="Renewal trend">
      <div className="trend-heading">
        <div>
          <h2>Renewals over time</h2>
          <p>Accounts by first renewal date</p>
        </div>
        {trend.total > trend.rows.length && (
          <span className="sort-note">
            Showing {trend.rows.length} of {trend.total.toLocaleString()} dates
          </span>
        )}
      </div>
      {trend.error ? (
        <div className="error-state">Renewal trend could not be loaded. Try again by changing a filter.</div>
      ) : !trend.loading && !data.length ? (
        <div className="empty-state">
          <h3>No renewal dates in this view</h3>
          <p>Change the filters to see accounts with a first renewal date.</p>
        </div>
      ) : (
        <div className="trend-chart">
          <LineChart
            data={data}
            x="renewal"
            y="count"
            title=""
            height={280}
            format="number"
            loading={trend.loading}
            legend="none"
              curve="linear"
              dots={false}
              grid
              xLabel="Renewal date"
            yLabel="Accounts"
          />
        </div>
      )}
    </section>
  );
}
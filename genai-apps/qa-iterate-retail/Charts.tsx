import type { Result, Row } from "@meridian/app";
import { BarChart, LineChart } from "@meridian/ui";

type CategoryRow = Row<"category_totals">;
type MonthlyRow = Row<"monthly_totals">;

interface ChartsProps {
  categories: Result<CategoryRow>;
  months: Result<MonthlyRow>;
}

export function Charts({ categories, months }: ChartsProps) {
  const categoryRows = categories.rows;
  const monthlyRows = [...months.rows].reverse();

  return (
    <section className="charts-grid" aria-label="Retail revenue and profit charts">
      <article className="card chart-card">
        <div className="chart-heading">
          <div>
            <p className="section-kicker">PRODUCT MIX</p>
            <h2>Performance by category</h2>
            <p className="chart-description">Revenue and gross profit across product categories.</p>
          </div>
          <span className="chart-index" aria-hidden="true">01</span>
        </div>
        {categories.error ? (
          <p className="state-message state-error" role="alert">{categories.error}</p>
        ) : !categories.loading && categoryRows.length === 0 ? (
          <p className="state-message">No category data available.</p>
        ) : (
          <>
            <div className="chart-wrap">
              <BarChart
                data={categoryRows}
                x="category"
                y={["revenue", "gross_profit"]}
                labels={{ revenue: "Revenue", gross_profit: "Gross profit" }}
                format="currency"
                legend="top"
                horizontal
                rounded
                grid
                height={360}
                loading={categories.loading}
              />
            </div>
            {!categories.loading && categories.total > categoryRows.length && (
              <p className="result-note">Showing {categoryRows.length} of {categories.total}</p>
            )}
          </>
        )}
      </article>

      <article className="card chart-card">
        <div className="chart-heading">
          <div>
            <p className="section-kicker">MONTHLY TREND</p>
            <h2>Revenue through time</h2>
            <p className="chart-description">Monthly revenue and gross profit over time.</p>
          </div>
          <span className="chart-index" aria-hidden="true">02</span>
        </div>
        {months.error ? (
          <p className="state-message state-error" role="alert">{months.error}</p>
        ) : !months.loading && monthlyRows.length === 0 ? (
          <p className="state-message">No monthly data available.</p>
        ) : (
          <>
            <div className="chart-wrap">
              <LineChart
                data={monthlyRows}
                x="month"
                y={["revenue", "gross_profit"]}
                labels={{ revenue: "Revenue", gross_profit: "Gross profit" }}
                format="currency"
                legend="top"
                curve="smooth"
                dots
                grid
                height={360}
                loading={months.loading}
              />
            </div>
            {!months.loading && months.total > months.rows.length && (
              <p className="result-note">Showing {months.rows.length} of {months.total}</p>
            )}
          </>
        )}
      </article>
    </section>
  );
}
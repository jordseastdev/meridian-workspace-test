import { useRows } from "@meridian/app";
import { Header } from "./Header";
import { Charts } from "./Charts";
import "./styles.css";

export default function App() {
  const categories = useRows("category_totals", {
    sort: [{ column: "revenue", direction: "desc" }],
    limit: 100,
  });
  const months = useRows("monthly_totals", {
    sort: [{ column: "month", direction: "asc" }],
    limit: 100,
  });

  return (
    <main className="app-shell">
      <Header />
      <Charts categories={categories} months={months} />
    </main>
  );
}
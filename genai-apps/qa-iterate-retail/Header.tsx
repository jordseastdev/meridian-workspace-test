import { TrendingUp } from "lucide-react";

export function Header() {
  return (
    <header className="page-header">
      <div className="brand-mark" aria-hidden="true">
        <TrendingUp size={21} strokeWidth={2.2} />
      </div>
      <div className="header-copy">
        <p className="eyebrow">RETAIL PERFORMANCE</p>
        <h1>Retail pulse</h1>
        <p className="header-subtitle">Revenue and profit at a glance.</p>
      </div>
    </header>
  );
}
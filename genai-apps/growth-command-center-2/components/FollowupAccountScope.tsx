import { useEffect, useMemo } from "react";
import { useRows, type Filter } from "@meridian/app";
import { QueryError } from "./QueryState";

/** Walk the keyed input table on the server so account filters are never limited
 * to the first page of matching follow-ups. These IDs scope the accounts read;
 * visible counts still come from that accounts read's total. */
export function FollowupAccountScope({
  filters, onResolved, after, preceding = [],
}: {
  filters: Filter<"followups">[];
  onResolved: (ids: number[]) => void;
  after?: number;
  preceding?: number[];
}) {
  const page = useRows("followups", {
    filters: [...filters, ...(after === undefined ? [] : [{ column: "account_id" as const, min: after + 1 }])],
    sort: [{ column: "account_id", direction: "asc" }],
    limit: 1000,
  });
  const ids = useMemo(() => [...preceding, ...page.rows.flatMap(row => row.account_id === null ? [] : [row.account_id])], [preceding, page.rows]);
  const last = page.rows[page.rows.length - 1]?.account_id;
  const more = page.total > 1000 && last != null;

  useEffect(() => {
    if (!page.loading && !page.error && !more) onResolved(ids);
  }, [page.loading, page.error, more, ids, onResolved]);

  if (page.error) return <QueryError message={`Could not filter accounts by follow-up: ${page.error}`} retry={page.refresh} />;
  if (page.loading || !more || last == null) return null;
  return <FollowupAccountScope filters={filters} onResolved={onResolved} after={last} preceding={ids} />;
}
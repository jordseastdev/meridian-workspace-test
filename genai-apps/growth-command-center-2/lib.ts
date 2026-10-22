import type { Filter } from "@meridian/app";

export function monthLabel(value: string | null | undefined) {
  if (!value) return "No month";
  const date = new Date(value.slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value.slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function numberLabel(value: number | null | undefined) {
  return value == null ? "Not available" : value.toLocaleString("en-US");
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export type FollowupStatus = "Not started" | "In progress" | "Done";
export type Priority = "Low" | "Medium" | "High";

export function followupFilters(priority: string, status: string): Filter<"followups">[] {
  const filters: Filter<"followups">[] = [];
  if (priority) filters.push({ column: "priority", values: [priority as Priority] });
  if (status) filters.push({
    column: "work_status",
    values: status === "Not started" ? ["Not started", null] : [status as FollowupStatus],
  });
  return filters;
}
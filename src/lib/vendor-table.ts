export function isMissingVendorSuggestionsTable(error: { message?: string; code?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    msg.includes("vendor_suggestions") ||
    msg.includes("schema cache")
  );
}

export const MIGRATION_002_HINT =
  "Run supabase/migrations/002_vendors_and_venue_lock.sql in your Supabase SQL Editor, then try again.";

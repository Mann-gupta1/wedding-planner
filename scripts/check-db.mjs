import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const tables = ["intakes", "recommendations", "payments"];
for (const t of tables) {
  const { error } = await supabase.from(t).select("id").limit(1);
  console.log(t + ":", error ? `MISSING (${error.code})` : "OK");
}

"use client";

import { createClient } from "@/lib/supabase/client";

export default function ReportButton({ target, name }: { target: string; name: string }) {
  async function report() {
    const reason = prompt(`Report ${name}? Tell us briefly what happened:`);
    if (reason === null) return;
    const { error } = await createClient().rpc("report_user", { target, reason });
    alert(error ? error.message : "Reported. Thanks for keeping it safe.");
  }
  return (
    <button className="text-xs text-stone-400 hover:text-red-600 ml-auto" onClick={report}>
      Report
    </button>
  );
}

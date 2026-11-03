"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SuspendedPage() {
  const router = useRouter();
  return (
    <main className="flex-1 grid place-items-center p-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-[80px] text-burgundy">Account suspended</h1>
        <p className="mt-3 text-stone-600">
          Several people reported this account. It&apos;s locked until the admin reviews it. If you think this is a mistake,
          contact the admin.
        </p>
        <button
          className="btn-ghost mt-6"
          onClick={async () => {
            await createClient().auth.signOut();
            router.push("/login");
            router.refresh();
          }}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

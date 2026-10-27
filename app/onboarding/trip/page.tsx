"use client";

import { useRouter } from "next/navigation";
import TripForm from "@/components/TripForm";

export default function TripPage() {
  const router = useRouter();
  return (
    <main className="max-w-md w-full mx-auto p-5">
      <p className="text-sm text-stone-500">Step 2 of 2</p>
      <h1 className="font-display text-3xl mt-1 mb-6">What you want</h1>
      <TripForm
        submitLabel="Find my people"
        onSaved={() => {
          router.push("/panel");
          router.refresh();
        }}
      />
    </main>
  );
}

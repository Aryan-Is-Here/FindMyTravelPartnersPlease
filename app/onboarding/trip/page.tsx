"use client";

import { useRouter } from "next/navigation";
import TripForm from "@/components/TripForm";

export default function TripPage() {
  const router = useRouter();
  return (
    <main className="max-w-md w-full mx-auto px-5 pt-10 pb-16">
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="font-display text-[72px] mt-2 mb-8">What you <span className="text-burgundy">want</span></h1>
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

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserDetailsForm from "@/components/UserDetailsForm";

export default function DetailsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) =>
        setAuth({ email: user?.email ?? "", name: (user?.user_metadata?.full_name as string) ?? "" }),
      );
  }, []);

  return (
    <main className="max-w-md w-full mx-auto px-5 pt-10 pb-16">
      <p className="eyebrow">Step 1 of 2</p>
      <h1 className="font-display text-[72px] mt-2 mb-8">About <span className="text-burgundy">you</span></h1>
      {auth && (
        <UserDetailsForm
          email={auth.email}
          defaultName={auth.name}
          submitLabel="Next"
          onSaved={() => {
            router.push("/onboarding/trip");
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

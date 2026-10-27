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
    <main className="max-w-md w-full mx-auto p-5">
      <p className="text-sm text-stone-500">Step 1 of 2</p>
      <h1 className="font-display text-3xl mt-1 mb-6">About you</h1>
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

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session and walks users through onboarding:
// login → user details → trip prefs → panel. Suspended users are locked out.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const path = request.nextUrl.pathname;
  const redirect = (to: string) => {
    if (path === to) return response;
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (path.startsWith("/auth") || path === "/privacy") return response;
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("users").select("status").maybeSingle();
  if (!profile) return redirect("/onboarding/details");
  if (profile.status === "suspended") return redirect("/suspended");

  const { data: trip } = await supabase.from("trip_prefs").select("user_id").maybeSingle();
  if (!trip) return redirect("/onboarding/trip");

  if (["/", "/login", "/suspended", "/onboarding/details", "/onboarding/trip"].includes(path)) {
    return redirect("/panel");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

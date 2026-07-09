import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session on every request and enforces coarse route
 * protection:
 *   - signed-out users hitting an app route  -> /login
 *   - signed-in but NOT approved             -> /pending
 *   - approved users hitting auth pages      -> /directory
 */
const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password", "/auth"];
const AUTH_PATHS = ["/login", "/signup", "/reset-password"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(p + "/"),
  );

  // Not signed in, on a protected route -> login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    const approved = profile?.status === "approved";
    const isAuthPage = AUTH_PATHS.some((p) => path === p);

    // Signed in but not approved -> hold on /pending. Password-reset and auth
    // callback paths are exempt so a locked-out member can still set a new
    // password (they arrive here with a fresh session from the email link).
    if (
      !approved &&
      path !== "/pending" &&
      !path.startsWith("/auth") &&
      !path.startsWith("/reset-password")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }

    // Approved user landing on an auth page -> into the app
    if (approved && (isAuthPage || path === "/pending")) {
      const url = request.nextUrl.clone();
      url.pathname = "/directory";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

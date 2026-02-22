import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return response;
  }

  /* Auth disabled for Open Access - skip client creation and session refresh 
  // createServerClient and Database imports removed from top as they were unused
  */

  // Auth disabled for Open Access — skip session refresh to avoid unnecessary network calls
  // await supabase.auth.getUser();

  return response;
}

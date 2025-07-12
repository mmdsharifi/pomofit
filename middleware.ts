import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSupabaseConfigured } from "./lib/supabase-utils"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Only initialize Supabase if environment variables are available
  if (isSupabaseConfigured()) {
    try {
      const supabase = createMiddlewareClient({
        req,
        res,
      })

      // Refresh session if expired - required for Server Components
      await supabase.auth.getSession()
    } catch (error) {
      console.error("Error in middleware:", error)
    }
  }

  return res
}

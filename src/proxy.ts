import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = ["/signin", "/signup", "/create-organization"];

export async function proxy(request: NextRequest) {
  let session = null;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[Proxy] Failed to get session:", error);
  }

  // No session and trying to access protected routes
  if (!session && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Session exists - check organization membership
  if (session) {
    // If user is on signin/signup pages, redirect to home or create-organization
    if (request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup") {
      // Check if user has any organizations
      try {
        const organizations = await auth.api.listOrganizations({
          headers: await headers(),
        });

        if (!organizations || organizations.length === 0) {
          // No organizations, redirect to create organization
          return NextResponse.redirect(new URL("/create-organization", request.url));
        }
      } catch (error) {
        console.error("[Proxy] Failed to list organizations:", error);
      }

      // User has organizations, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // For protected routes, check if user has organizations
    if (!publicRoutes.includes(request.nextUrl.pathname)) {
      try {
        const organizations = await auth.api.listOrganizations({
          headers: await headers(),
        });

        if (!organizations || organizations.length === 0) {
          // No organizations, redirect to create organization
          return NextResponse.redirect(new URL("/create-organization", request.url));
        }
      } catch (error) {
        console.error("[Proxy] Failed to list organizations:", error);
        // On error, allow through to avoid blocking legitimate users
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/signin", "/signup", "/create-organization"],
};

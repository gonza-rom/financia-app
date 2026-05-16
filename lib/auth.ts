// src/lib/auth.ts
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

/**
 * Returns the authenticated Supabase session user.
 * Redirects to /auth/login if not authenticated.
 * Wrapped in React cache() to deduplicate within a single render pass.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return user;
});

/**
 * Returns the full Prisma user record for the authenticated user.
 * Syncs the user from Supabase to Prisma on first call.
 */
export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser();

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {},
    create: {
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name ?? null,
      currency: "USD",
    },
  });

  return user;
});
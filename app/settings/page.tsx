// src/app/settings/page.tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/features/settings/profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Profile</h2>
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
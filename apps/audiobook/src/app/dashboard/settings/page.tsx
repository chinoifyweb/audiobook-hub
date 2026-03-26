"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Button } from "@repo/ui";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";





import {
  User,
  Lock,
  Bell,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetching, setProfileFetching] = useState(true);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNewReleases: true,
    emailPurchaseConfirmation: true,
    emailSubscriptionUpdates: true,
    emailPromotions: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "error";
    text: string;
  } | null>(null);

  // Fetch profile data (including phone) from API
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setFullName(data.user.fullName || "");
          setPhone(data.user.phone || "");
        } else if (session?.user) {
          // Fallback to session data
          setFullName(session.user.name || "");
        }
      } catch {
        // Fallback to session data
        if (session?.user) {
          setFullName(session.user.name || "");
        }
      } finally {
        setProfileFetching(false);
      }
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  if (!session?.user) {
    return null;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage({
          type: "success",
          text: "Profile updated successfully.",
        });
        // Update the session with new name
        await updateSession({ name: fullName });
      } else {
        setProfileMessage({
          type: "error",
          text: data.error || "Failed to update profile.",
        });
      }
    } catch {
      setProfileMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: data.error || "Failed to change password.",
        });
      }
    } catch {
      setPasswordMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setNotifLoading(true);
    setNotifMessage(null);

    try {
      // Save notification preferences to user profile metadata
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
        }),
      });

      if (res.ok) {
        setNotifMessage({
          type: "success",
          text: "Notification preferences saved.",
        });
      } else {
        setNotifMessage({
          type: "error",
          text: "Failed to save preferences.",
        });
      }
    } catch {
      setNotifMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return;

    setDeleteLoading(true);
    setDeleteMessage(null);

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Sign out and redirect to home
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setDeleteMessage({
          type: "error",
          text: data.error || "Failed to delete account.",
        });
      }
    } catch {
      setDeleteMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={session.user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={profileFetching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                disabled={profileFetching}
              />
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  profileMessage.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {profileMessage.text}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={profileLoading || profileFetching}>
              {profileLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={8}
                required
              />
            </div>

            {passwordMessage && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  passwordMessage.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {passwordMessage.text}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Change Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose what emails you receive from us
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              key: "emailPurchaseConfirmation" as const,
              label: "Purchase confirmations",
              description: "Receive email receipts for your purchases",
            },
            {
              key: "emailSubscriptionUpdates" as const,
              label: "Subscription updates",
              description:
                "Get notified about subscription renewals and changes",
            },
            {
              key: "emailNewReleases" as const,
              label: "New releases",
              description:
                "Be the first to know about new audiobooks and ebooks",
            },
            {
              key: "emailPromotions" as const,
              label: "Promotions and deals",
              description: "Receive special offers and discount notifications",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => toggleNotification(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  notifications[item.key]
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    notifications[item.key]
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}

          {notifMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                notifMessage.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {notifMessage.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {notifMessage.text}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={handleSaveNotifications}
            disabled={notifLoading}
          >
            {notifLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-600 dark:text-red-400">
              Delete Account
            </CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showDeleteConfirm ? (
            <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <div className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">This action is irreversible</p>
                  <p className="mt-1 opacity-80">
                    All your data, including your library, purchase history, and
                    listening progress will be permanently deleted. Any active
                    subscriptions will be cancelled.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="deleteConfirm"
                  className="text-sm text-red-800 dark:text-red-200"
                >
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                  className="border-red-300 dark:border-red-800"
                />
              </div>
              {deleteMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  {deleteMessage.text}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteText("");
                    setDeleteMessage(null);
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteText !== "DELETE" || deleteLoading}
                  onClick={handleDeleteAccount}
                >
                  {deleteLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete My Account
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

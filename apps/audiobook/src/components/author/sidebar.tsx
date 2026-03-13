"use client";

import { Button, Avatar, AvatarFallback, AvatarImage, Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, Separator, cn } from "@repo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  Menu,
  Headphones,
} from "lucide-react";
import { signOut } from "next-auth/react";






const sidebarLinks = [
  { href: "/author", label: "Overview", icon: LayoutDashboard },
  { href: "/author/books", label: "My Books", icon: BookOpen },
  { href: "/author/books/new", label: "Upload New", icon: Upload },
  { href: "/author/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/author/earnings", label: "Earnings", icon: Wallet },
  { href: "/author/settings", label: "Settings", icon: Settings },
];

interface AuthorSidebarProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

function SidebarNav({ user }: AuthorSidebarProps) {
  const pathname = usePathname();

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : "U";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <Headphones className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">AudioShelf</span>
      </div>

      <Separator />

      {/* Author badge */}
      <div className="px-6 py-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Author Dashboard
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {sidebarLinks.map((link) => {
          const isActive =
            link.href === "/author"
              ? pathname === "/author"
              : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user.name || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AuthorSidebar({ user }: AuthorSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <SidebarNav user={user} />
      </aside>

      {/* Mobile sidebar */}
      <div className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav user={user} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          <span className="font-bold">AudioShelf</span>
        </div>
        <div className="ml-auto">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback className="text-xs">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </>
  );
}

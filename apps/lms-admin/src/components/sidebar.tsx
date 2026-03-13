"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  ClipboardList,
  Award,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/programs", label: "Programs", icon: GraduationCap },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/lecturers", label: "Lecturers", icon: UserCheck },
  { href: "/students", label: "Students", icon: Users },
  { href: "/academic-calendar", label: "Academic Calendar", icon: Calendar },
  { href: "/fees", label: "Fees", icon: CreditCard },
  { href: "/results", label: "Results", icon: ClipboardList },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <BookOpen className="h-6 w-6" />
            <span className="font-bold text-lg">BBA Admin</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-6 py-3">
          <p className="text-xs text-sidebar-foreground/50">
            Berean Bible Academy
          </p>
        </div>
      </aside>
    </>
  );
}

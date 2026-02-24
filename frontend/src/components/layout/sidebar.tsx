"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Handshake,
  FileText,
  FileEdit,
  DollarSign,
  ClipboardCheck,
  Lightbulb,
  Megaphone,
  BookOpen,
  Scale,
  Users,
  ShieldCheck,
  Database,
  MessageSquare,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: Search },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "RFP", href: "/rfp", icon: FileText },
  { name: "Proposals", href: "/proposals", icon: FileEdit },
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Contracts", href: "/contracts", icon: ClipboardCheck },
  { name: "Strategy", href: "/strategy", icon: Lightbulb },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Research", href: "/research", icon: BookOpen },
  { name: "Legal", href: "/legal", icon: Scale },
  { name: "Teaming", href: "/teaming", icon: Users },
  { name: "Security", href: "/security", icon: ShieldCheck },
  { name: "Knowledge Vault", href: "/knowledge-vault", icon: Database },
  { name: "Communications", href: "/communications", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Handshake className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">Deal Manager</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-3 py-4">
        <p className="px-3 text-xs text-muted-foreground">
          AI Deal Manager v0.1.0
        </p>
      </div>
    </aside>
  );
}

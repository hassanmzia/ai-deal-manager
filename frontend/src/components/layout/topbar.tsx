"use client";

import Link from "next/link";
import { Bell, LogOut, User, Trash2, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export function Topbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  // Lazy initializer: runs only on the client, avoiding SSR/hydration timestamp mismatch.
  // Module-level Date.now() calls differ between server and client render times.
  const [notifications, setNotifications] = useState<Notification[]>(() => [
    {
      id: 1,
      message: 'Deal "Enterprise Software License" moved to Won',
      type: 'success',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      message: 'New RFP received from Acme Corp',
      type: 'info',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: 3,
      message: 'Proposal review deadline tomorrow',
      type: 'warning',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);

  const displayName = user
    ? `${user.first_name || user.username} ${user.last_name || ""}`.trim()
    : "User";

  const unreadCount = notifications.length;

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          AI Deal Manager
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearAll();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="border-b last:border-b-0">
                    <div className="flex items-start gap-3 px-2 py-3 hover:bg-accent transition-colors group">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          notification.type === 'success'
                            ? 'bg-green-500'
                            : notification.type === 'warning'
                            ? 'bg-yellow-500'
                            : notification.type === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          removeNotification(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex cursor-pointer items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

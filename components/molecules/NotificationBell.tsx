"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { Notification } from "@/types/user";
import { subscribeToNotifications, markNotificationRead } from "@/lib/notifications";
import { toMillis } from "@/lib/utils";

export default function NotificationBell({ uid }: { uid: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToNotifications(uid, setItems);
    return unsub;
  }, [uid]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-error text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-border font-semibold text-sm text-text-primary">Notifications</div>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-text-secondary">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(uid, n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 text-sm hover:bg-slate-50 ${
                  !n.read ? "bg-indigo-50/40 font-medium" : "text-text-secondary"
                }`}
              >
                <p className="text-text-primary">{n.message}</p>
                <p className="text-xs text-text-secondary mt-1">{new Date(toMillis(n.createdAt)).toLocaleString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

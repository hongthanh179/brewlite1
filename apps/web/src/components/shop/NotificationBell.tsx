"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Bell, CheckCheck, Loader2, X, BellRing, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    orderId?: number;
    data?: { orderId?: number };
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
}

export default function NotificationBell() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [mounted, setMounted] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [loading, setLoading] = useState(false);

    // State hỗ trợ vuốt xuống để đóng Bottom Sheet trên mobile
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartY = useRef<number | null>(null);

    const triggerRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadData = useCallback(async () => {
        if (!isAuthenticated || !user?.id) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

        try {
            const [countRes, listRes] = await Promise.all([
                apiFetch<{ count: number }>(`/notifications/me/unread-count?userId=${user.id}`).catch(() => ({ count: 0 })),
                apiFetch<any>(`/notifications/me?userId=${user.id}`).catch(() => ({ data: [] })),
            ]);

            setUnreadCount(countRes?.count ?? 0);

            const items = Array.isArray(listRes)
                ? listRes
                : Array.isArray(listRes?.data)
                    ? listRes.data
                    : [];

            setNotifications(items);
        } catch {
            // Bỏ qua lỗi mạng ngầm
        }
    }, [isAuthenticated, user?.id]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        const handleVisibility = () => {
            if (document.visibilityState === "visible") loadData();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [loadData]);

    // Đóng popup khi click ra ngoài (tương thích cả Portal trên Desktop) hoặc nhấn ESC
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current &&
                !triggerRef.current.contains(target) &&
                sheetRef.current &&
                !sheetRef.current.contains(target)
            ) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    // Khóa cuộn nền khi mở Bottom Sheet trên Mobile PWA
    useEffect(() => {
        if (open) {
            document.body.classList.add("overflow-hidden", "sm:overflow-auto");
        } else {
            document.body.classList.remove("overflow-hidden", "sm:overflow-auto");
            setDragOffset(0);
        }
        return () => document.body.classList.remove("overflow-hidden", "sm:overflow-auto");
    }, [open]);

    const markAsRead = async (id: number) => {
        if (!user?.id) return;
        // Optimistic update: phản hồi tức thì trên giao diện mobile
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));

        try {
            await apiFetch(`/notifications/me/${id}/read?userId=${user.id}`, { method: "PATCH" });
        } catch (err: any) {
            loadData(); // Đồng bộ lại nếu lỗi mạng
            toast.error(err.message || "Không thể cập nhật trạng thái");
        }
    };

    const markAllRead = async () => {
        if (!user?.id || loading) return;
        setLoading(true);
        const prevList = notifications;
        const prevCount = unreadCount;

        // Optimistic update
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await apiFetch(`/notifications/me/read-all?userId=${user.id}`, { method: "PATCH" });
            toast.success("Đã đánh dấu đọc tất cả");
        } catch (err: any) {
            setNotifications(prevList);
            setUnreadCount(prevCount);
            toast.error(err.message || "Lỗi thao tác");
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: NotificationItem) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }

        const orderId =
            item.orderId ??
            item.data?.orderId ??
            item.title?.match(/#(\d+)/)?.[1] ??
            item.message?.match(/#(\d+)/)?.[1];

        setOpen(false);

        if (!orderId) return;

        const targetAnchor = `order-${orderId}`;

        if (pathname === "/shop/orders") {
            const el = document.getElementById(targetAnchor);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-[#B45F2B]", "shadow-lg");
                setTimeout(() => {
                    el.classList.remove("ring-2", "ring-[#B45F2B]", "shadow-lg");
                }, 3000);
            } else {
                window.location.hash = targetAnchor;
            }
        } else {
            router.push(`/shop/orders#${targetAnchor}`);
        }
    };

    // Xử lý vuốt xuống trên thanh kéo (Drag Handle / Header)
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const deltaY = e.touches[0].clientY - touchStartY.current;
        if (deltaY > 0) {
            setDragOffset(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (dragOffset > 90) {
            setOpen(false);
        }
        setDragOffset(0);
        touchStartY.current = null;
    };

    if (!isAuthenticated) return null;

    const displayedNotifications =
        filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

    const sheetContent = (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:block sm:pointer-events-none">
            {/* Backdrop mờ nền trên Mobile */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
                onClick={() => setOpen(false)}
            />

            {/* Container chính: Bottom Sheet trên Mobile, Floating Panel góc phải trên Desktop */}
            <div
                ref={sheetRef}
                style={{
                    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                }}
                className="relative z-10 w-full max-h-[85dvh] rounded-t-3xl bg-[#FFFFFF] border-t sm:border border-[#E8E2D9] shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-transform duration-150 ease-out sm:fixed sm:top-16 sm:right-6 sm:w-96 sm:max-h-[32rem] sm:rounded-2xl animate-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200"
            >
                {/* Vùng kéo (Swipe Handle + Header) */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="bg-[#FAF7F2] border-b border-[#E8E2D9] shrink-0 select-none"
                >
                    {/* Thanh quai kéo trên Mobile */}
                    <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
                        <div className="w-10 h-1.5 bg-[#D5CBC0] rounded-full" />
                    </div>

                    {/* Hàng tiêu đề & Nút đóng chuẩn chạm 44px */}
                    <div className="flex items-center justify-between px-4 py-2.5 sm:py-3.5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#B45F2B]/12 flex items-center justify-center text-[#B45F2B]">
                                <BellRing className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm text-[#2B2118]">Thông báo</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#B45F2B] text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={loading}
                                    className="min-h-10 px-2.5 rounded-xl text-xs font-semibold text-[#B45F2B] hover:bg-[#B45F2B]/10 active:bg-[#B45F2B]/15 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <CheckCheck className="w-4 h-4" />
                                    )}
                                    <span>Đọc hết</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Đóng thông báo"
                                className="min-w-11 min-h-11 flex items-center justify-center rounded-xl text-[#6B5E52] hover:bg-[#E8E2D9]/50 active:bg-[#E8E2D9] sm:hidden"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tab lọc nhanh Tất cả / Chưa đọc */}
                    <div className="flex items-center gap-2 px-4 pb-2.5">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`min-h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                                filter === "all"
                                    ? "bg-[#2B2118] text-white"
                                    : "bg-white text-[#6B5E52] border border-[#E8E2D9]"
                            }`}
                        >
                            Tất cả ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("unread")}
                            className={`min-h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                                filter === "unread"
                                    ? "bg-[#B45F2B] text-white"
                                    : "bg-white text-[#6B5E52] border border-[#E8E2D9]"
                            }`}
                        >
                            Chưa đọc ({unreadCount})
                        </button>
                    </div>
                </div>

                {/* Danh sách thông báo có đệm safe-area-inset-bottom */}
                <div className="overflow-y-auto divide-y divide-[#E8E2D9] overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {displayedNotifications.length === 0 ? (
                        <div className="py-12 px-6 text-center space-y-1.5">
                            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] mx-auto flex items-center justify-center mb-2">
                                <Bell className="w-6 h-6 text-[#6B5E52]/40" />
                            </div>
                            <p className="font-semibold text-sm text-[#2B2118]">
                                {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
                            </p>
                            <p className="text-xs text-[#6B5E52]">
                                Cập nhật trạng thái pha chế và đơn hàng của bạn sẽ xuất hiện tại đây
                            </p>
                        </div>
                    ) : (
                        displayedNotifications.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`w-full p-4 flex items-start gap-3 text-left transition-colors active:bg-[#FDF1E7] ${
                                    item.isRead ? "bg-[#FFFFFF]" : "bg-[#FDF1E7]/55 hover:bg-[#FDF1E7]/80"
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                                        item.isRead
                                            ? "bg-[#FAF7F2] text-[#6B5E52]"
                                            : "bg-[#B45F2B]/15 text-[#B45F2B]"
                                    }`}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-[13px] leading-snug ${
                                                item.isRead
                                                    ? "font-medium text-[#2B2118]/85"
                                                    : "font-bold text-[#2B2118]"
                                            }`}
                                        >
                                            {item.title}
                                        </p>
                                        {!item.isRead && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#B45F2B] shrink-0 mt-1 ring-2 ring-[#FDF1E7]" />
                                        )}
                                    </div>

                                    <p className="text-xs text-[#6B5E52] mt-1 leading-relaxed line-clamp-2">
                                        {item.message}
                                    </p>

                                    <span className="text-[11px] font-medium text-[#6B5E52]/80 mt-1.5 block">
                                        {formatRelativeTime(item.createdAt)}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative" ref={triggerRef}>
            {/* Nút Chuông chuẩn touch target >= 44x44px (min-w-11 min-h-11) */}
            <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl text-[#2B2118] hover:bg-[#FAF7F2] active:scale-95 transition-all min-w-11 min-h-11"
                aria-label="Thông báo đơn hàng"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-[#A12B1F] text-white text-[10px] font-bold h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-[#FFFFFF]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </Button>

            {open && mounted && createPortal(sheetContent, document.body)}
        </div>
    );
}
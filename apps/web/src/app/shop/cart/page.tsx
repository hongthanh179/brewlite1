"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Minus, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EditLineDialog from "@/components/shop/EditLineDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { CHECKOUT_PATH, LOGIN_PATH, formatVND, lineTotal, type CartItem } from "@/lib/shop";

export default function CartPage() {
    const { items, totalPrice, totalQty, hydrated, increase, decrease, remove } = useCart();
    const [editing, setEditing] = useState<CartItem | null>(null);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const handleCheckout = () => {
        if (isAuthenticated) return router.push(CHECKOUT_PATH);
        toast.info("Vui lòng đăng nhập để thanh toán");
        router.push(`${LOGIN_PATH}?redirect=${encodeURIComponent(CHECKOUT_PATH)}`);
    };

    if (!hydrated) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-3">
                <Skeleton className="h-8 w-40 rounded-xl bg-[#E8E2D9]/60" />
                <Skeleton className="h-40 rounded-2xl bg-[#E8E2D9]/60" />
                <Skeleton className="h-16 rounded-2xl bg-[#E8E2D9]/60" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto py-4">
                <div className="bg-white border border-[#E8E2D9] rounded-2xl py-14 sm:py-16 px-4 text-center shadow-xs">
                    <ShoppingBag className="w-12 h-12 mx-auto text-[#6B5E52]/40" />
                    <h1 className="text-lg sm:text-xl font-bold text-[#2B2118] mt-3">Giỏ hàng trống</h1>
                    <p className="text-xs sm:text-sm text-[#6B5E52] mt-1">
                        Hãy chọn một món từ thực đơn để bắt đầu đặt nhé.
                    </p>
                    <Button
                        asChild
                        className="rounded-xl mt-5 bg-[#B45F2B] hover:bg-[#9A4F22] text-white font-semibold h-11 px-6 text-sm shadow-xs"
                    >
                        <Link href="/shop">Xem thực đơn</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto pb-28 sm:pb-8 space-y-4">
            {/* Tiêu đề trang + nút quay lại menu */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Link
                        href="/shop"
                        aria-label="Quay lại thực đơn"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#E8E2D9] text-[#2B2118] hover:bg-[#FAF7F2]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#2B2118]">
                        Giỏ hàng ({totalQty} ly)
                    </h1>
                </div>
                <Link
                    href="/shop"
                    className="text-xs font-semibold text-[#B45F2B] hover:text-[#9A4F22] hover:underline shrink-0"
                >
                    + Thêm món
                </Link>
            </div>

            {/* Danh sách các món trong giỏ hàng */}
            <ul className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs divide-y divide-[#E8E2D9]">
                {items.map((i) => (
                    <li key={i.key} className="p-3.5 sm:p-4 transition-colors">
                        {/* Hàng 1: Tên món, Size & Nút Xóa */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h3 className="font-semibold text-sm sm:text-base text-[#2B2118] leading-tight">
                                        {i.name}
                                    </h3>
                                    {i.sizeName && (
                                        <span className="text-[11px] font-medium text-[#6B5E52] bg-[#FAF7F2] border border-[#E8E2D9] px-1.5 py-0.5 rounded-md">
                                            Size {i.sizeName}
                                        </span>
                                    )}
                                </div>

                                {/* Topping đính kèm */}
                                {i.toppings.length > 0 && (
                                    <p className="text-xs text-[#6B5E52] mt-1 leading-relaxed">
                                        + {i.toppings.map((t) => t.name).join(", ")}
                                    </p>
                                )}

                                {/* Đơn giá */}
                                <p className="text-xs text-[#6B5E52]/80 mt-0.5">
                                    {formatVND(i.unitPrice)} / ly
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-9 h-9 rounded-xl text-[#6B5E52] hover:text-red-600 hover:bg-red-50 shrink-0 -mt-1 -mr-1"
                                aria-label={`Xóa ${i.name}`}
                                onClick={() => remove(i.key)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Hàng 2: Bộ đếm số lượng, Nút sửa và Thành tiền */}
                        <div className="mt-3 pt-2.5 border-t border-[#E8E2D9]/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className="flex items-center border border-[#E8E2D9] rounded-xl bg-[#FAF7F2] h-9">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-9 h-9 rounded-l-xl text-[#2B2118] hover:bg-[#E8E2D9]/60 active:scale-95"
                                        aria-label={`Giảm ${i.name}`}
                                        onClick={() => decrease(i.key)}
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </Button>
                                    <span className="w-7 text-center text-sm font-bold text-[#2B2118]">
                                        {i.qty}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-9 h-9 rounded-r-xl text-[#2B2118] hover:bg-[#E8E2D9]/60 active:scale-95"
                                        aria-label={`Tăng ${i.name}`}
                                        disabled={i.qty >= i.maxQty}
                                        onClick={() => increase(i.key)}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-2.5 text-xs font-semibold text-[#6B5E52] hover:text-[#B45F2B] hover:bg-[#FDF1E7] rounded-xl flex items-center gap-1"
                                    aria-label={`Tùy chỉnh ${i.name}`}
                                    onClick={() => setEditing(i)}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Sửa</span>
                                </Button>
                            </div>

                            <span className="text-sm sm:text-base font-bold text-[#B45F2B]">
                                {formatVND(lineTotal(i))}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Thanh tổng kết & Thanh toán: Fixed sát đáy trên mobile, Sticky trên desktop */}
            <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:static sm:rounded-2xl sm:border sm:p-4 sm:shadow-xs flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <span className="text-xs text-[#6B5E52] block font-medium">
                        Tổng cộng ({totalQty} món)
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#2B2118]">
                        {formatVND(totalPrice)}
                    </span>
                </div>

                <Button
                    className="rounded-xl bg-[#2B2118] hover:bg-[#1A140E] text-white font-bold h-11 px-6 sm:px-8 text-sm shadow-xs active:scale-[0.98] transition-all"
                    disabled={authLoading}
                    onClick={handleCheckout}
                >
                    Thanh toán
                </Button>
            </div>

            {editing && (
                <EditLineDialog key={editing.key} item={editing} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}
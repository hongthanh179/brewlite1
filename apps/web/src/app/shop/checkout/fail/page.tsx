"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, RotateCcw, Coffee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function FailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get("orderId");
    const orderCode = searchParams.get("orderCode") || orderId;

    return (
        <div className="max-w-md mx-auto py-4 sm:py-8">
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 sm:p-8 shadow-xs text-center space-y-5 sm:space-y-6">
                {/* Icon thất bại đỏ */}
                <div className="w-16 h-16 bg-[#FBE9E7] text-[#A12B1F] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#FBE9E7]/50">
                    <AlertCircle className="w-9 h-9 sm:w-10 sm:h-10" />
                </div>

                <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B2118]">
                        Thanh toán thất bại!
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B5E52] leading-relaxed">
                        Giao dịch chưa hoàn tất. Đơn nước của bạn đã được lưu để thanh toán lại.
                    </p>
                </div>

                {/* Box thông tin đơn hàng */}
                <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-3.5 sm:p-4 text-left space-y-3">
                    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                        <span className="text-[#6B5E52] shrink-0">Mã đơn hàng:</span>
                        <span className="font-mono font-bold text-[#2B2118] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D9] truncate">
                            #{orderCode || "---"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                        <span className="text-[#6B5E52] shrink-0">Trạng thái:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FBE9E7] text-[#A12B1F] whitespace-nowrap">
                            ● Chưa thanh toán
                        </span>
                    </div>
                </div>

                {/* Nút hành động */}
                <div className="space-y-2.5 pt-1">
                    <Button
                        onClick={() =>
                            router.push(orderId ? `/shop/orders#order-${orderId}` : "/shop/orders")
                        }
                        className="w-full h-12 rounded-xl bg-[#2B2118] hover:bg-[#1A140E] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Thanh toán lại ngay</span>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full h-11 rounded-xl border-[#E8E2D9] bg-white text-[#2B2118] hover:bg-[#FAF7F2] font-semibold text-sm active:scale-[0.98] transition-transform"
                    >
                        <Link href="/shop" className="flex items-center justify-center gap-2">
                            <Coffee className="w-4 h-4" />
                            <span>Tiếp tục gọi món</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutFailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-[#6B5E52]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#B45F2B]" />
                    <span>Đang tải thông tin đơn hàng...</span>
                </div>
            }
        >
            <FailContent />
        </Suspense>
    );
}
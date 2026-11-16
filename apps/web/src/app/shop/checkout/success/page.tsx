"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, Clock, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessView() {
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode") || "BW-2026";
    const status = searchParams.get("status") || "PAID";

    const statusLabel = status === "PAID" ? "Đã thanh toán" : status;

    return (
        <div className="max-w-md mx-auto py-4 sm:py-8">
            <div className="bg-white border border-[#E8E2D9] rounded-3xl p-5 sm:p-8 shadow-xs text-center space-y-5 sm:space-y-6">
                <div className="w-16 h-16 bg-[#E7F4EA] text-[#1E6B34] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#E7F4EA]/50">
                    <CheckCircle2 className="w-9 h-9 sm:w-10 sm:h-10" />
                </div>

                <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B2118]">
                        Đặt hàng thành công!
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B5E52] leading-relaxed">
                        Đơn nước của bạn đã được chuyển đến quầy pha chế.
                    </p>
                </div>

                <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-3.5 sm:p-4 text-left space-y-3">
                    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                        <span className="text-[#6B5E52] shrink-0">Mã đơn hàng:</span>
                        <span className="font-mono font-bold text-[#2B2118] bg-white px-2.5 py-1 rounded-lg border border-[#E8E2D9] truncate">
                            #{orderCode}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 text-xs sm:text-sm">
                        <span className="text-[#6B5E52] shrink-0">Trạng thái:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7F4EA] text-[#1E6B34] whitespace-nowrap">
                            ● {statusLabel}
                        </span>
                    </div>
                </div>

                <div className="space-y-2.5 pt-1">
                    <Button
                        asChild
                        className="w-full h-12 rounded-xl bg-[#2B2118] hover:bg-[#1A140E] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-transform"
                    >
                        <Link href="/shop/orders">
                            <Clock className="w-4 h-4 mr-2" /> Theo dõi tiến trình đơn
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        asChild
                        className="w-full h-11 rounded-xl border-[#E8E2D9] bg-white text-[#2B2118] hover:bg-[#FAF7F2] font-semibold text-sm active:scale-[0.98] transition-transform"
                    >
                        <Link href="/shop">
                            <Coffee className="w-4 h-4 mr-2" /> Tiếp tục gọi món
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-20 text-sm text-[#6B5E52]">
                    Đang tải thông tin đơn...
                </div>
            }
        >
            <SuccessView />
        </Suspense>
    );
}
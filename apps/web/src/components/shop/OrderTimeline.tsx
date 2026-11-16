"use client";

import { Check, Clock, CreditCard, Coffee, BellRing, CheckCircle2 } from "lucide-react";

const STEPS = [
    { key: "PENDING", label: "Chờ duyệt", icon: Clock },
    { key: "PAID", label: "Đã thanh toán", icon: CreditCard },
    { key: "PREPARING", label: "Đang pha chế", icon: Coffee },
    { key: "READY", label: "Mời nhận nước", icon: BellRing },
    { key: "COMPLETED", label: "Hoàn tất", icon: CheckCircle2 },
];

export default function OrderTimeline({ currentStatus }: { currentStatus: string }) {
    const normalizedStatus = currentStatus === "BREWING" ? "PREPARING" : currentStatus;
    const activeIdx = STEPS.findIndex((s) => s.key === normalizedStatus);
    const validIdx = activeIdx === -1 ? 0 : activeIdx;

    return (
        <div className="w-full py-2 [--node:32px] sm:[--node:36px]">
            <div className="relative flex items-start justify-between">
                {/* Đường line nền mờ nối qua tâm nút đầu -> nút cuối */}
                <div className="absolute left-[calc(var(--node)/2)] right-[calc(var(--node)/2)] top-[calc(var(--node)/2)] -translate-y-1/2 h-1 rounded-full bg-[#E8E2D9] z-0" />

                {/* Đường line tiến trình */}
                <div
                    className="absolute left-[calc(var(--node)/2)] top-[calc(var(--node)/2)] -translate-y-1/2 h-1 rounded-full bg-[#B45F2B] transition-all duration-500 z-0"
                    style={{
                        width: `calc((100% - var(--node)) * (${validIdx} / ${STEPS.length - 1}))`,
                    }}
                />

                {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isDone = idx < validIdx;
                    const isCurrent = idx === validIdx;

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-[var(--node)] h-[var(--node)] rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isCurrent
                                        ? "bg-[#2B2118] text-white shadow-md shadow-[#2B2118]/25 ring-4 ring-[#FDF1E7] scale-105"
                                        : isDone
                                            ? "bg-[#B45F2B] text-white"
                                            : "bg-[#FAF7F2] text-[#6B5E52]/60 border border-[#E8E2D9]"
                                }`}
                            >
                                {isDone ? (
                                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                ) : (
                                    <StepIcon
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCurrent ? "animate-bounce" : ""}`}
                                    />
                                )}
                            </div>
                            <span
                                className={`text-[10px] sm:text-[11px] leading-tight mt-2 max-w-[58px] sm:max-w-none text-center transition-colors ${
                                    isCurrent
                                        ? "font-bold text-[#2B2118]"
                                        : isDone
                                            ? "font-medium text-[#6B5E52]"
                                            : "font-medium text-[#6B5E52]/60"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import OptionFields from "@/components/shop/OptionFields";
import { useCart } from "@/contexts/CartContext";
import { calcUnitPrice, formatVND, sortedSizes } from "@/lib/shop";
import type { Product, Topping } from "@/lib/types";

interface Props {
    product: Product;
    toppings: Topping[];
    onClose: () => void;
}

export default function CustomizeDialog({ product, toppings, onClose }: Props) {
    const { addItem } = useCart();
    const sizes = sortedSizes(product);
    const [sizeId, setSizeId] = useState<number | null>(sizes[0]?.id ?? null);
    const [pickedIds, setPickedIds] = useState<number[]>([]);
    const [qty, setQty] = useState(1);

    // Lọc topping an toàn theo danh mục món
    const availableToppings = useMemo(() => {
        if (!product) return [];

        const categoryToppings = (product as any).category?.toppings;
        if (Array.isArray(categoryToppings)) {
            return categoryToppings;
        }

        const catName = (product.category?.name || "").toLowerCase();
        if (catName.includes("cà phê") || catName.includes("coffee")) {
            return [];
        }
        if (catName.includes("trái cây") || catName.includes("fruit")) {
            return toppings.filter((t) => {
                const name = t.name.toLowerCase();
                return name.includes("trái cây") || name.includes("trắng");
            });
        }

        return toppings;
    }, [product, toppings]);

    const size = sizes.find((s) => s.id === sizeId) ?? null;
    const chosen = useMemo(
        () =>
            availableToppings
                .filter((t) => pickedIds.includes(t.id))
                .map((t) => ({ id: t.id, name: t.name, price: Number(t.price) })),
        [availableToppings, pickedIds]
    );

    const basePrice = Number(product.price);
    const sizeSurcharge = Number(size?.surcharge ?? 0);
    const unitPrice = calcUnitPrice(basePrice, sizeSurcharge, chosen);
    const maxStock = product.stock ?? 999999;

    const toggle = (id: number) =>
        setPickedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const submit = () => {
        addItem({
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            sizeName: size?.name ?? null,
            sizeSurcharge,
            toppings: chosen,
            qty,
            basePrice,
            unitPrice,
            maxQty: maxStock,
        });
        toast.success(`Đã thêm ${product.name} vào giỏ`);
        onClose();
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 max-w-none w-full rounded-t-3xl rounded-b-none border-x-0 border-b-0 bg-white p-0 gap-0 flex flex-col max-h-[88dvh] overflow-hidden sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:border">
                {/* Thanh nắm nhận diện Bottom Sheet trên mobile */}
                <div className="pt-2.5 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1.5 rounded-full bg-[#E8E2D9] mx-auto" />
                </div>

                {/* Header cố định */}
                <DialogHeader className="px-5 pt-2 sm:pt-5 pb-3 border-b border-[#E8E2D9] text-left shrink-0">
                    <DialogTitle className="text-lg font-bold text-[#2B2118] pr-6">
                        {product.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#6B5E52] line-clamp-2">
                        {product.description || `Giá gốc ${formatVND(basePrice)}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Vùng chọn Size & Topping cuộn độc lập */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <OptionFields
                        sizes={sizes}
                        sizeId={sizeId}
                        onSize={setSizeId}
                        toppings={availableToppings}
                        pickedIds={pickedIds}
                        onToggle={toggle}
                    />
                </div>

                {/* Footer cố định dưới đáy màn hình, dễ bấm bằng ngón cái */}
                <DialogFooter className="flex-row items-center gap-3 px-5 pt-3 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-[#E8E2D9] bg-white shrink-0">
                    <div className="flex items-center border border-[#E8E2D9] bg-[#FAF7F2] rounded-xl h-11 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-10 rounded-l-xl text-[#2B2118] hover:bg-[#E8E2D9]/60"
                            aria-label="Giảm số lượng"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span
                            className="w-8 text-center text-sm font-bold text-[#2B2118]"
                            aria-live="polite"
                        >
                            {qty}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-10 rounded-r-xl text-[#2B2118] hover:bg-[#E8E2D9]/60"
                            aria-label="Tăng số lượng"
                            disabled={qty >= maxStock}
                            onClick={() => setQty((q) => q + 1)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={submit}
                        className="h-11 rounded-xl flex-1 bg-[#B45F2B] hover:bg-[#9A4F22] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-transform"
                    >
                        Thêm vào giỏ · {formatVND(unitPrice * qty)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
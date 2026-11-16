import type { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFooter from "@/components/shop/ShopFooter";

export default function ShopLayout({ children }: { children: ReactNode }) {
    return (
        <CartProvider>
            <div className="min-h-dvh flex flex-col overflow-x-clip bg-[#FAF7F2]">
                <ShopHeader />
                <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    {children}
                </main>
                <ShopFooter />
            </div>
        </CartProvider>
    );
}
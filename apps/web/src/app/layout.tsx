// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
    title: "BrewLite",
    description: "Hệ thống đặt cà phê và quản lý cửa hàng",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: "#FAF7F2",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
        <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <AuthProvider>
            {children}
        </AuthProvider>
        <Toaster position="top-center" richColors closeButton />
        </body>
        </html>
    );
}
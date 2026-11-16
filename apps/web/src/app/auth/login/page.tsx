"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Coffee,
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    Phone,
    Sparkles,
    Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const { login } = useAuth();

    // true = Đăng nhập, false = Đăng ký
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setLoading(true);

        try {
            if (isLoginMode) {
                // 1. ĐĂNG NHẬP (POST /auth/login)
                const res = await apiFetch<any>("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ email: email.trim(), password }),
                });

                const token =
                    typeof res === "string"
                        ? res
                        : res?.access_token || res?.accessToken || res?.token;

                if (!token) throw new Error("Không nhận được token xác thực!");

                const userInfo = res?.user || {
                    email: email.trim(),
                    name: res?.name || "Khách hàng",
                    role: res?.role || "CUSTOMER",
                    loyaltyPoints: res?.loyaltyPoints ?? res?.points ?? 0,
                };

                login(token, userInfo);
                localStorage.setItem("token", token);
                localStorage.setItem("brewlite_token", token);
                localStorage.setItem("brewlite_user", JSON.stringify(userInfo));

                toast.success(`Xin chào, ${userInfo.name || "bạn"}! Đăng nhập thành công.`);

                if (redirectUrl) {
                    router.replace(redirectUrl);
                } else if (String(userInfo.role).toUpperCase() === "ADMIN") {
                    router.replace("/");
                } else {
                    router.replace("/shop");
                }
            } else {
                // 2. ĐĂNG KÝ (POST /auth/register)
                await apiFetch<any>("/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                        name: name.trim(),
                        phone: phone.trim(),
                    }),
                });

                toast.success("Đăng ký thành viên thành công! Vui lòng đăng nhập.");
                setIsLoginMode(true);
                setPassword("");
            }
        } catch (err: any) {
            toast.error(
                err.message ||
                (isLoginMode
                    ? "Email hoặc mật khẩu không chính xác!"
                    : "Lỗi khi đăng ký tài khoản!"),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-5">
            {/* Nút quay lại thực đơn */}
            <div>
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B5E52] hover:text-[#2B2118] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại thực đơn</span>
                </Link>
            </div>

            {/* Header nhận diện thương hiệu BrewLite */}
            <div className="text-center">
                <div className="inline-flex w-14 h-14 bg-[#2B2118] rounded-2xl items-center justify-center shadow-lg shadow-[#2B2118]/15 mb-3 text-white">
                    <Coffee className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#2B2118] tracking-tight">
                    BrewLite Coffee
                </h1>
                <p className="text-xs text-[#6B5E52] mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#B45F2B]" />
                    <span>Đặt nước nhanh & Tích lũy điểm Beans</span>
                </p>
            </div>

            {/* Thẻ Form */}
            <div className="bg-white border border-[#E8E2D9] rounded-3xl shadow-xs p-5 sm:p-7">
                <div className="flex items-center gap-2 mb-5 border-b border-[#E8E2D9]">
                    <button
                        type="button"
                        onClick={() => setIsLoginMode(true)}
                        className={`flex-1 text-sm font-bold pb-3 transition-colors border-b-2 ${
                            isLoginMode
                                ? "border-[#B45F2B] text-[#2B2118]"
                                : "border-transparent text-[#6B5E52] hover:text-[#2B2118]"
                        }`}
                    >
                        Đăng Nhập
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLoginMode(false)}
                        className={`flex-1 text-sm font-bold pb-3 transition-colors border-b-2 ${
                            !isLoginMode
                                ? "border-[#B45F2B] text-[#2B2118]"
                                : "border-transparent text-[#6B5E52] hover:text-[#2B2118]"
                        }`}
                    >
                        Đăng Ký
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLoginMode && (
                        <>
                            <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-200">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-bold text-[#6B5E52] uppercase"
                                >
                                    Họ và tên
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E52]" />
                                    <Input
                                        id="name"
                                        type="text"
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 rounded-xl h-11 text-base sm:text-sm border-[#E8E2D9] focus-visible:ring-[#B45F2B]"
                                        placeholder="Nguyễn Văn A"
                                        required={!isLoginMode}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-200 delay-75">
                                <Label
                                    htmlFor="phone"
                                    className="text-xs font-bold text-[#6B5E52] uppercase"
                                >
                                    Số điện thoại
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E52]" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10 rounded-xl h-11 text-base sm:text-sm border-[#E8E2D9] focus-visible:ring-[#B45F2B]"
                                        placeholder="0901234567"
                                        required={!isLoginMode}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="email"
                            className="text-xs font-bold text-[#6B5E52] uppercase"
                        >
                            Email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E52]" />
                            <Input
                                id="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 rounded-xl h-11 text-base sm:text-sm border-[#E8E2D9] focus-visible:ring-[#B45F2B]"
                                placeholder="name@brewlite.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="password"
                            className="text-xs font-bold text-[#6B5E52] uppercase"
                        >
                            Mật khẩu
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E52]" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete={isLoginMode ? "current-password" : "new-password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-11 rounded-xl h-11 text-base sm:text-sm border-[#E8E2D9] focus-visible:ring-[#B45F2B]"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#6B5E52] hover:text-[#2B2118] hover:bg-[#FAF7F2] transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl mt-2 font-bold text-sm bg-[#2B2118] hover:bg-[#1A140E] text-white shadow-xs active:scale-[0.98] transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isLoginMode ? "Đang xác thực..." : "Đang tạo tài khoản..."}
                            </span>
                        ) : isLoginMode ? (
                            "Đăng Nhập"
                        ) : (
                            "Đăng Ký Thành Viên"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function AuthLoginPage() {
    return (
        <div className="min-h-dvh bg-[#FAF7F2] flex items-center justify-center px-4 py-8">
            <Suspense
                fallback={
                    <div className="flex items-center gap-2 text-xs text-[#6B5E52]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#B45F2B]" />
                        <span>Đang tải biểu mẫu...</span>
                    </div>
                }
            >
                <AuthForm />
            </Suspense>
        </div>
    );
}
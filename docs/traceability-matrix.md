
# Ma Trận Truy Vết Yêu Cầu Hệ Thống (Traceability Matrix)  

**Mục lục điều hướng (Bookmarks):**
- [1. Ma Trận Truy Vết Yêu Cầu Chức Năng (FR-01 – FR-08)](#1-ma-trận-truy-vết-yêu-cầu-chức-năng-fr-01--fr-08)
- [2. Ma Trận Truy Vết Yêu Cầu Phi Chức Năng (NFR-01 – NFR-05)](#2-ma-trận-truy-vết-yêu-cầu-phi-chức-năng-nfr-01--nfr-05)
- [3. Truy Vết Quyết Định Kiến Trúc (ADR-001 – ADR-010)](#3-truy-vết-quyết-định-kiến-trúc-adr-001--adr-010)
- [4. Tổng Hợp Bộ Kiểm Thử Tự Động Xác Minh (28/28 PASS)](#4-tổng-hợp-bộ-kiểm-thử-tự-động-xác-minh-2828-pass)

Tài liệu này thiết lập liên kết truy vết hai chiều xuyên suốt vòng đời phát triển phần mềm của **BrewLite**: từ **Đặc tả yêu cầu (FR/NFR & Acceptance Criteria)** -> **Mô hình hóa & Quyết định kiến trúc (Use-case, UML, C4, ADR)** -> **Hiện thực hóa (Backend API & Frontend PWA)** -> **Kiểm thử tự động (Unit, Integration, E2E) & Minh chứng vận hành**.

---

## 1. Ma Trận Truy Vết Yêu Cầu Chức Năng (FR-01 – FR-08)

| Mã FR | Mức ưu tiên | Use-case & Mô tả nghiệp vụ | Thiết kế & Kiến trúc | Hiện thực (Backend / Frontend) | Kiểm thử & Minh chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Must | **UC-01:** Xem thực đơn, tìm kiếm (có/không dấu) và lọc theo danh mục | Activity Diagram (Hình 2.3), Class `Product`, `Category` (Hình 2.5), C4 Container (Hình 3.2) | `GET /api/products`, `GET /api/categories` (`ProductsController`); trang `/shop` (`ProductCard`) | `UT-04` (`products.service.spec.ts`), `IT-01` (#2), `E2E-01` |
| **FR-02** | Must | **UC-02:** Xem chi tiết đồ uống, chọn kích cỡ (S, M, L) và topping theo nhóm món | Class `Product`, `ProductSize`, `Topping` (Hình 2.5), Physical ERD (Hình 4.1) | `GET /api/products/:id`, `GET /api/toppings`; trang `/shop/products/[id]` & `CustomizeDialog` | `UT-04` (`products.service.spec.ts`), `E2E-01` |
| **FR-03** | Must | **UC-03:** Quản lý giỏ hàng (thêm, sửa tùy chọn, tăng/giảm số lượng, tính tổng tiền) | Activity Diagram (Hình 2.3), Tiêu chí `AC-N01.3` | `CartContext` + `LocalStorage` (`apps/web/src/contexts/CartContext.tsx`), trang `/shop/cart` | `E2E-01` (`tests/e2e/checkout.spec.ts`) |
| **FR-04** | Must | **UC-04, UC-10:** Đăng ký, đăng nhập xác thực JWT và quản lý hồ sơ người dùng | Class `User` (Hình 2.5), `ADR-005` (Stateless JWT & RBAC) | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`; trang `/auth/login`, `/shop/profile` | `IT-01` (#3), `E2E-01` |
| **FR-05** | Must | **UC-05, UC-06:** Đặt đơn hàng, áp mã giảm giá, tính lại giá trên server, Khóa lạc quan & Snapshot giá | Activity Diagram (Hình 2.3), Sequence Diagram (Hình 2.4), `ADR-006`, `ADR-009` | `POST /api/orders` (`OrdersService.create`), `POST /api/coupons/validate`; trang `/shop/checkout` | `UT-01` (`orders-concurrency.spec.ts`), `IT-01` (#4), `E2E-01` |
| **FR-06** | Must | **UC-07, UC-08:** Thanh toán Ví/Thẻ an toàn lũy biến (`Idempotency-Key`), thử lại khi thất bại và cộng điểm tích lũy | Activity Diagram (Hình 2.3), Sequence Diagram (Hình 2.4), `ADR-007`, `ADR-008` | `POST /api/payments` (`PaymentsService.create`, bắt lỗi `P2002`); màn hình thanh toán & biên nhận `/shop/checkout` | `UT-02` (`payments-idempotency.spec.ts`), `IT-01` (#5), Hình 4.4, `E2E-01` |
| **FR-07** | Must | **UC-09:** Xem lịch sử đơn hàng và theo dõi tiến độ chế biến theo thời gian thực | Class `Order` (Hình 2.5), Order State Machine (Bảng 2.2) | `GET /api/orders/me`, `GET /api/orders/:id`; trang `/shop/orders` (`OrderTimeline`, `NotificationBell`) | `IT-01` (#6), `E2E-01` |
| **FR-08** | Must | **UC-11, UC-12, UC-13:** Quản lý đơn hàng, cập nhật trạng thái chế biến, hủy đơn hoàn tài nguyên & tự hủy đơn quá hạn 15 phút | Order State Machine (Bảng 2.10), `ADR-009` | `PATCH /api/orders/:id/status`, `DELETE /api/orders/:id`, `@Cron(EVERY_MINUTE)`; khu vực `(admin)/*` | `UT-03` (`orders-state-machine.spec.ts` – 15 tests) |

---

## 2. Ma Trận Truy Vết Yêu Cầu Phi Chức Năng (NFR-01 – NFR-05)

| Mã NFR | Nhóm chất lượng | Tiêu chí chấp nhận trọng tâm | Kiến trúc & Giải pháp kỹ thuật | Hiện thực & Kiểm chứng |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-01** | Hiệu năng | Phản hồi danh sách món <= 1s (`AC-N01.1`), hiển thị trên 4G <= 2.5s (`AC-N01.2`), giỏ hàng cập nhật tức thì (`AC-N01.3`) | Kiến trúc C4 Container (Hình 3.2), tách tải tính toán giỏ hàng tại Client | Phân trang `GET /api/products?limit=...`, Next.js App Router, `CartContext` (`UT-04`, `IT-01`, `E2E-01`) |
| **NFR-02** | Bảo mật | Băm mật khẩu (`AC-N02.1`), cô lập dữ liệu cá nhân (`AC-N02.2`), chặn truy cập trái phép trang Admin (`AC-N02.3`), HTTPS (`AC-N02.5`), giới hạn upload <= 5MB (`AC-N02.7`) | `ADR-005` (JWT + RBAC), Deployment Diagram (Hình 3.3) | `bcrypt` (10 rounds), `JwtStrategy`, `RolesGuard`, kiểm tra `order.userId`, Multer filter <= 5MB, Render HTTPS (`IT-01` #3–#4 HTTP 401, Hình 4.3 HTTP 403) |
| **NFR-03** | Tính dễ sử dụng | Hiển thị chuẩn ở độ rộng 360/390/768px (`AC-N03.1`), đặt món <= 6 bước (`AC-N03.3`), thông báo tiếng Việt rõ ràng (`AC-N03.4`), định dạng tiền VNĐ (`AC-N03.5`) | Thiết kế Mobile-first hướng tới PWA (`Mục 5.2`) | Tailwind CSS responsive, `HttpExceptionFilter` tiếng Việt, Sonner toast, `formatCurrency` (`E2E-01` trên viewport `390x844` iPhone 14) |
| **NFR-04** | Phát hành & Vận hành | Chạy thử độc lập từ mã nguồn (`AC-N04.1`), seed nhất quán (`AC-N04.2`), CI chặn lỗi trên PR (`AC-N04.3`), CD kèm Smoke Test & Rollback (`AC-N04.4`, `AC-N04.5`) | `ADR-001`, `ADR-003`, `ADR-010`, Deployment Diagram (Hình 3.3) | `docker-compose.yml`, `render.yml`, `.github/workflows/main.yml`, `prisma/seed.ts` (`state = 42`), `.env.example` (Hình 6.1–6.3) |
| **NFR-05** | Độ tin cậy & Toàn vẹn dữ liệu | Giao dịch nguyên tử (`AC-N05.1`), chống bán âm kho (`AC-N05.2`), chống thanh toán trùng (`AC-N05.3`), Health Check kết nối DB (`AC-N05.4`), không lộ mật khẩu trong log (`AC-N05.5`) | `ADR-003`, `ADR-004`, `ADR-006`, `ADR-007`, `ADR-009` | `prisma.$transaction`, `Product.version`, `Payment.idempotencyKey` (`@unique`), `GET /api/health` (`SELECT 1`) (`UT-01`, `UT-02`, `UT-03`, `IT-01` #1 & #5) |

---

## 3. Truy Vết Quyết Định Kiến Trúc (ADR-001 – ADR-010)

| Mã ADR | Quyết định kiến trúc | Yêu cầu liên quan | Tệp / Thành phần hiện thực chính |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Tổ chức Monorepo (`apps/web`, `apps/api`) | NFR-04 | Cấu trúc thư mục gốc `brewlite1/`, `.github/workflows/main.yml` |
| **ADR-002** | Backend theo kiểu Modular Monolith (Controller – Service – Persistence) | NFR-01, NFR-04 | `apps/api/src/app.module.ts` và 12 module nghiệp vụ độc lập |
| **ADR-003** | PostgreSQL 16 làm RDBMS duy nhất, quản lý bằng Prisma ORM & Migration | NFR-04, NFR-05 | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/` |
| **ADR-004** | Lưu toàn bộ giá trị tiền tệ bằng số nguyên `Int` (đơn vị VNĐ) | FR-02, FR-05, NFR-03 | Các trường `price`, `surcharge`, `total`, `discountAmount`, `finalAmount`, `amount` trong `schema.prisma` |
| **ADR-005** | Xác thực phi trạng thái bằng JWT Bearer Token & phân quyền RBAC (`CUSTOMER`, `ADMIN`) | FR-04, NFR-02 | `apps/api/src/auth/jwt.strategy.ts`, `roles.guard.ts`, `AuthContext.tsx` |
| **ADR-006** | Chống bán vượt tồn kho bằng Khóa lạc quan (`Product.version`) | FR-05, NFR-05 | `apps/api/src/orders/orders.service.ts` (`tx.product.updateMany`) |
| **ADR-007** | Thanh toán lũy biến (`Idempotency-Key` + ràng buộc `@unique` & bắt lỗi `P2002`) | FR-06, NFR-05 | `apps/api/src/payments/payments.service.ts`, `schema.prisma` |
| **ADR-008** | Mô phỏng cổng thanh toán qua `Mock Payment Service` tách biệt hợp đồng giao tiếp | FR-06, NFR-04 | `apps/api/src/payments/payments.service.ts` (cờ `simulateFailure`) |
| **ADR-009** | Quản lý vòng đời đơn bằng `Order State Machine` & bảo toàn lịch sử bằng `Price Snapshot` | FR-05, FR-07, FR-08, NFR-05 | `OrdersService.assertTransition`, bảng `OrderItem` & `OrderItemTopping` |
| **ADR-010** | Đóng gói Docker multi-stage, CI/CD tự động qua GHCR và triển khai trên Render | NFR-04 | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `render.yml`, `.github/workflows/main.yml` |

---

## 4. Tổng Hợp Bộ Kiểm Thử Tự Động Xác Minh (28/28 PASS)

| Mã Test | Cấp độ kiểm thử | Tệp mã nguồn kiểm thử | Kịch bản & Yêu cầu xác minh | Số lượng | Kết quả |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **UT-01** | Unit Test | `apps/api/src/orders/orders-concurrency.spec.ts` | Kho còn 1 sản phẩm (`version = 1`), 3 request đặt đồng thời -> 1 thành công, 2 bị chặn HTTP `409 Conflict` (`FR-05`, `NFR-05`) | 1 test | **PASS** |
| **UT-02** | Unit Test | `apps/api/src/payments/payments-idempotency.spec.ts` | Gửi lặp 2 lần thanh toán cùng `idempotencyKey` -> trả về kết quả cũ (`isDuplicate: true`), không nhân đôi giao dịch/điểm (`FR-06`, `NFR-05`) | 2 tests | **PASS** |
| **UT-03** | Unit Test | `apps/api/src/orders/orders-state-machine.spec.ts` | Chặn 7 bước chuyển trạng thái sai quy tắc (`BadRequestException`) và xác nhận 8 bước chuyển hợp lệ (`FR-08`, `NFR-05`) | 15 tests | **PASS** |
| **UT-04** | Unit Test | `apps/api/src/products/products.service.spec.ts` | Phân trang danh sách thực đơn, xem chi tiết và ném `NotFoundException` khi ID không tồn tại (`FR-01`, `FR-02`) | 3 tests | **PASS** |
| **IT-01** | Integration Test | `apps/api/test/orders-checkout.e2e-spec.ts` | Kiểm thử tuần tự 6 bước qua HTTP & PostgreSQL thật: `/api/health` -> `/api/products` -> Auth JWT (`401`/`201`) -> Đặt đơn `PENDING` -> Thanh toán lặp -> `/api/orders/me` (`PAID`) | 6 tests | **PASS** |
| **E2E-01** | Mobile E2E Test | `tests/e2e/checkout.spec.ts` | Mô phỏng thiết bị di động `390x844` (iPhone 14) chạy trọn vẹn luồng: `/shop` -> Chọn tùy chọn -> Giỏ hàng -> Đăng ký/Đăng nhập -> Thanh toán thẻ -> Theo dõi đơn (`NFR-03`) | 1 flow | **PASS** |

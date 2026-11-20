# ☕ BrewLite - Cashless Coffee Ordering System

> Hệ thống đặt và thanh toán cà phê không dùng tiền mặt (Cashless Ordering) với kiến trúc Mobile-First, tích hợp các cơ chế chịu lỗi hệ thống (Robustness), khóa lạc quan (Optimistic Locking), tự động hóa CI/CD và bảo đảm tính toàn vẹn dữ liệu (Data Integrity).

---

## 1. Giới thiệu tổng quan & Môi trường Production

**BrewLite** là giải pháp phần mềm toàn diện hỗ trợ chuỗi cửa hàng cà phê hiện đại vận hành quy trình bán hàng khép kín không tiền mặt. Hệ thống giải quyết các bài toán quan trọng trong thương mại điện tử và dịch vụ F&B:
- **Trải nghiệm khách hàng mượt mà:** Xem thực đơn theo danh mục, tùy biến size/topping, áp dụng mã voucher giảm giá, tích lũy điểm thành viên BrewLite Beans.
- **Thanh toán & Xử lý đơn linh hoạt:** Hỗ trợ thanh toán VietQR động (Demo), thanh toán lại khi giao dịch thất bại, chủ động hủy đơn hoàn kho/voucher và theo dõi tiến độ pha chế theo thời gian thực.
- **Độ tin cậy & Chịu tải cao:** Đảm bảo không xảy ra hiện tượng bán vượt tồn kho (Overselling) khi nhiều khách đặt cùng một ly nước cuối cùng, chống trừ tiền hai lần (Double Spending) và tự động hoàn trả kho/voucher khi giao dịch quá hạn.

### Đường dẫn triển khai Production (HTTPS)

| Thành phần | Đường dẫn truy cập (URL) | Ghi chú |
| :--- | :--- | :--- |
| **Frontend Web (HTTPS)** | https://brewlite-web-n5o5.onrender.com | Giao diện khách hàng & quản trị |
| **Backend REST API** | https://brewlite-api-8lxn.onrender.com/api | Tiền tố `/api` cho toàn bộ endpoint |
| **Health Check Endpoint** | https://brewlite-api-8lxn.onrender.com/api/health | Trả về trạng thái server & kết nối DB |
| **Swagger API Docs** | https://brewlite-api-8lxn.onrender.com/api/docs | Tài liệu OpenAPI 3.0 tương tác trực tiếp |

> **Lưu ý vận hành Production:** Cơ sở dữ liệu PostgreSQL trên Render giao tiếp với Backend qua mạng nội bộ riêng (**Private Internal Network**), không mở kết nối trực tiếp ra Internet cho phía client. Toàn bộ khóa bí mật (`DATABASE_URL`, `JWT_SECRET`, API Keys) được quản lý tập trung qua **GitHub Secrets** và **Render Environment Variables**, tuyệt đối không lưu trong mã nguồn.

---

## 2. Công nghệ cốt lõi (Tech Stack)

### Backend (`apps/api`)
- **Framework:** [NestJS](https://nestjs.com/) (Node.js 20 LTS)
- **Cơ sở dữ liệu & ORM:** [PostgreSQL 16](https://www.postgresql.org/) kết hợp [Prisma ORM](https://www.prisma.io/)
- **Xác thực & Bảo mật:** Passport JWT, Bcrypt, Class-Validator, ValidationPipe (whitelist)
- **Tác vụ nền:** `@nestjs/schedule` (Cron jobs tự động quét đơn tồn)
- **Tài liệu API:** Swagger / OpenAPI 3.0
- **Kiểm thử tự động:** Jest Runner (Unit Test, Concurrency Simulation)

### Frontend (`apps/web`)
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React Server & Client Components)
- **Ngôn ngữ:** TypeScript
- **Giao diện & Styling:** Tailwind CSS, Radix UI / shadcn/ui
- **Icons & Thông báo:** Lucide Icons, Sonner Toast
- **Cơ chế cập nhật:** Real-time polling timeline đơn hàng & thông báo trạng thái

### DevOps, Container & CI/CD
- **Docker & Docker Compose:** Đóng gói độc lập các service (`postgres`, `api`, `web`)
- **Container Registry:** GitHub Container Registry (`ghcr.io`)
- **CI/CD & Cloud Hosting:** GitHub Actions & Render Cloud Platform

---

## 3. Các cơ chế chịu lỗi & Toàn vẹn dữ liệu (Core Robustness Criteria)

Dự án BrewLite được thiết kế để vượt qua các tiêu chí kỹ thuật khắt khe về độ tin cậy của hệ thống giao dịch:

### 3.1. Máy trạng thái đơn hàng (Order State Machine Transition Guard)
Quy trình chuyển đổi trạng thái đơn hàng được bảo vệ bằng bảng chuyển dịch nghiêm ngặt (`allowedTransitions`):
```text
[PENDING] ────┬───> [PAID] ───> [PREPARING] ───> [READY] ───> [COMPLETED]
              │       ▲
              ├───> [PAYMENT_FAILED] ───┘ (Thanh toán lại)
              │       │
              ▼       ▼
          [CANCELLED] (Hoàn tồn kho, hoàn voucher, thu hồi điểm)
```
- **Chặn nhảy cóc phi logic:** Chặn chuyển từ `PENDING` trực tiếp sang `COMPLETED` hoặc `READY`.
- **Bảo vệ đơn hoàn tất:** Một khi đơn đã `COMPLETED` hoặc `CANCELLED`, hệ thống nghiêm cấm chuyển ngược về `PENDING` hoặc `PAID`.
- **Hỗ trợ thanh toán lại & hủy đơn chủ động:** Cho phép đơn từ `PAYMENT_FAILED` chuyển sang `PAID` khi khách thanh toán lại thành công, hoặc chuyển sang `CANCELLED` (tự động hoàn kho & voucher) khi khách bấm hủy hoặc quá thời gian chờ.

### 3.2. Chống tạo trùng lặp giao dịch (Dual-Layer Idempotency Key)
- Mỗi yêu cầu thanh toán bắt buộc mang theo một `Idempotency-Key` (chuẩn UUID v4).
- **Tầng 1 (Pre-check):** Kiểm tra sự tồn tại của key trong cơ sở dữ liệu. Nếu key đã được xử lý thành công, API trả ngay kết quả giao dịch trước đó kèm cờ `isDuplicate: true` mà không tạo giao dịch mới, không trừ ví và không cộng trùng điểm Beans.
- **Tầng 2 (Database Constraint):** Ràng buộc `@unique` trên trường `idempotencyKey` trong bảng `Payment` ở cấp độ PostgreSQL, bọc bắt mã lỗi `P2002` để xử lý xung đột trong tích tắc.
- **Tầng giao diện (UI Lock):** Nút thanh toán tự khóa (`disabled`) và hiển thị trạng thái đang xử lý để ngăn người dùng nhấp đúp (double click).

### 3.3. Khóa lạc quan chống bán vượt tồn kho (Optimistic Locking & Overselling Prevention)
- Mỗi sản phẩm trong bảng `Product` được quản lý bởi trường số hiệu phiên bản `version: Int`.
- Khi trừ tồn kho, câu lệnh thực thi có điều kiện đồng thời:
  ```typescript
  prisma.product.updateMany({
    where: {
      id: productId,
      version: currentVersion,       // Khóa lạc quan
      stock: { gte: orderQuantity }, // Điều kiện nguyên tử tồn kho
    },
    data: {
      stock: { decrement: orderQuantity },
      version: { increment: 1 },
    },
  });
  ```
- Nếu nhiều người cùng đặt món nước cuối cùng tại cùng một thời điểm: chỉ duy nhất 1 request đầu tiên cập nhật thành công (`count: 1`), các request còn lại sẽ nhận `count: 0` và bị ngắt ngay lập tức với lỗi `ConflictException (409)`.

### 3.4. Tự động dọn dẹp & Hoàn hủy tự động (Cron Scheduler & Rollback)
- Tiến trình ngầm chạy định kỳ mỗi phút (`@Cron(CronExpression.EVERY_MINUTE)`).
- Tự động hủy (`CANCELLED`) các đơn hàng ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` bị bỏ quên quá 15 phút và hoàn trả toàn bộ tồn kho (`stock`), cập nhật `version`, hoàn lượt sử dụng mã giảm giá (`usedCount`) và gửi thông báo cho khách hàng.

---

## 4. Bộ kiểm thử tự động (Automated Test Suites)

Hệ thống đi kèm trọn bộ 18 kịch bản kiểm thử tự động chứng minh tính toàn vẹn nghiệp vụ:

| Tệp kiểm thử | Tiêu chí đánh giá | Số lượng test case | Trạng thái |
| :--- | :--- | :---: | :---: |
| `orders-state-machine.spec.ts` | **(a) Order State Machine Guard:** Chặn 7 trường hợp đổi trạng thái sai; duyệt 8 bước chuyển trạng thái hợp lệ | 15 tests | **PASSED** |
| `payments-idempotency.spec.ts` | **(b) Idempotency Key:** Kiểm thử gọi 2 lần cùng key chỉ tạo 1 giao dịch, không nhân đôi đơn/điểm | 2 tests | **PASSED** |
| `orders-concurrency.spec.ts` | **(c) Concurrency Control:** 3 request tranh chấp 1 ly nước tồn kho, chỉ 1 đơn thành công, 2 đơn báo lỗi 409 | 1 test | **PASSED** |

---

## 5. Cấu trúc thư mục (Project Structure)

```text
brewlite1/
├── .github/
│   └── workflows/                      # Pipeline CI/CD GitHub Actions
├── apps/
│   ├── api/                            # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── migrations/             # Các bản migration CSDL theo phiên bản
│   │   │   ├── schema.prisma           # Cấu trúc CSDL PostgreSQL
│   │   │   └── seed.ts                 # Dữ liệu mẫu khởi tạo
│   │   ├── src/
│   │   │   ├── auth/                   # Đăng ký, Đăng nhập, JWT Strategy
│   │   │   ├── orders/                 # Nghiệp vụ đơn hàng, State Machine, Concurrency
│   │   │   ├── payments/               # Thanh toán, Idempotency, Quản lý giao dịch
│   │   │   ├── coupons/                # Quản lý mã giảm giá
│   │   │   ├── products/               # Quản lý đồ uống, danh mục, topping
│   │   │   └── notifications/          # Chuông thông báo & cảnh báo
│   │   ├── .env.example                # Mẫu biến môi trường cho Backend
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                            # Frontend Next.js (App Router)
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/login/         # Đăng nhập & Đăng ký
│       │   │   └── shop/
│       │   │       ├── checkout/       # Màn hình thanh toán & popup VietQR
│       │   │       ├── orders/         # Lịch sử đơn hàng, timeline, thanh toán lại & hủy đơn
│       │   │       ├── cart/           # Giỏ hàng
│       │   │       └── profile/        # Thẻ thành viên BrewLite & điểm Beans
│       │   ├── components/             # UI components, timeline, modal
│       │   └── contexts/               # AuthContext, CartContext
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml                  # Điều phối container (Postgres, API, Web)
├── render.yaml                         # Hạ tầng dưới dạng mã (IaC) cho Render
├── .env.example                        # Mẫu biến môi trường gốc
└── README.md
```

---asdasdasd

## 6. Hướng dẫn cài đặt, chạy Local, Test và Build

### Bước 0: Clone Repository & Chuẩn bị biến môi trường
```bash
git clone [https://github.com/sotsoatchamcom/brewlite1.git](https://github.com/sotsoatchamcom/brewlite1.git)
cd brewlite1

# Tạo tệp cấu hình môi trường từ tệp mẫu
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```
*(Đảm bảo trong `apps/api/.env` đã có chuỗi kết nối `DATABASE_URL` hợp lệ và `JWT_SECRET`; đối với Frontend chạy local, cấu hình biến `NEXT_PUBLIC_API_URL="http://localhost:3001/api"`).*

---

### Cách 1: Khởi chạy toàn bộ bằng Docker Compose (Khuyên dùng)

1. **Xây dựng và khởi chạy các container:**
   ```bash
   docker compose up -d --build
   ```
2. **Chạy Migration và nạp dữ liệu mẫu (Seed):**
   ```bash
   docker compose exec api npx prisma migrate deploy
   docker compose exec api npx prisma db seed
   ```
3. **Các lệnh quản lý Docker thường dùng:**
  - Xem log hệ thống: `docker compose logs -f`
  - Dừng hệ thống (giữ dữ liệu): `docker compose down`
  - Dừng và xóa toàn bộ volume dữ liệu để cài lại từ đầu: `docker compose down -v`

---

### Cách 2: Chạy trực tiếp trên máy cục bộ (Local Development)

Yêu cầu máy đã cài **Node.js >= 20.x**, **npm >= 10.x** và **PostgreSQL 16** (hoặc chạy PostgreSQL qua Docker).

1. **Khởi động PostgreSQL:**
   ```bash
   docker compose up -d postgres
   ```
2. **Cài đặt thư viện, chạy Migration, Seed và khởi động Backend (`apps/api`):**
   ```bash
   cd apps/api
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   npm run start:dev
   ```
   *Backend API hoạt động tại: `http://localhost:3001/api`*

3. **Khởi động Frontend (`apps/web`) ở một cửa sổ Terminal mới:**
   ```bash
   cd apps/web
   npm install --legacy-peer-deps
   npm run dev
   ```
   *Giao diện Web hoạt động tại: `http://localhost:3000`*

---

### Chạy Kiểm thử (Test) và Đóng gói (Build)

```bash
# 1. Chạy bộ kiểm thử chịu lỗi cốt lõi (18 test cases) tại apps/api
cd apps/api
npm run test:robustness

# 2. Chạy toàn bộ Unit Test & Kiểm tra quy tắc mã nguồn (Lint)
npm test
npm run lint

# 3. Build kiểm tra đóng gói Production cho cả Backend và Frontend
cd ../api && npm run build
cd ../web && npm run build
```

---

## 7. Quy trình Triển khai tự động (CI/CD Pipeline)

Hệ thống sử dụng **GitHub Actions** để tự động hóa hoàn toàn quy trình kiểm thử và đưa mã nguồn lên môi trường Production mỗi khi có Pull Request được merge vào nhánh `main` hoặc khi gắn tag phiên bản (`v*`):

```text
[Push / Tag] ──> [Lint, Test & Build] ──> [Docker Image (SHA/Tag)] ──> [Push ghcr.io] ──> [Deploy Render] ──> [Safe Migration] ──> [Smoke Test]
```

1. **Quality Gate (`Lint, Test and Build`):** Chạy kiểm tra ESLint, toàn bộ bộ test Jest và biên dịch kiểm tra lỗi cho cả `apps/api` và `apps/web`. Pipeline sẽ dừng ngay nếu có bất kỳ lỗi nào.
2. **Đóng gói Container & Push Registry:** Build Docker Image từ `Dockerfile` của API và Web, gắn tag tự động theo mã băm commit (`sha-<commit_sha>`) hoặc Semantic Version (`v1.0.0`), sau đó đẩy lên **GitHub Container Registry (`ghcr.io`)**.
3. **Triển khai Production qua CI Secrets:** Gọi Deploy Hook và API của Render thông qua các biến bí mật lưu trên GitHub (`RENDER_API_DEPLOY_HOOK`, `RENDER_WEB_DEPLOY_HOOK`, `RENDER_API_KEY`,...).
4. **Chạy Migration an toàn:** Trong tệp cấu hình `render.yaml`, service `brewlite-api` thực thi lệnh `npx prisma migrate deploy && npm run start:prod` để chỉ áp dụng các file migration mới chưa chạy, tuyệt đối không làm mất dữ liệu hiện có.
5. **Health Check & Smoke Test:** Tự động kiểm tra mã phản hồi `HTTP 200 OK` tại `/api/health` và trang chủ Frontend sau khi triển khai. Nếu Smoke Test thất bại, workflow lập tức dừng (`exit 1`) và kích hoạt cơ chế cảnh báo/rollback.

---

## 8. Quy trình Khôi phục sự cố (Rollback Procedure)

Khi phát hiện bản triển khai mới gặp lỗi runtime hoặc Smoke Test trên CI báo thất bại, thực hiện khôi phục về phiên bản ổn định theo một trong các cách sau:

### Cách 1: Rollback tức thì trên Render Dashboard (Nhanh nhất – dưới 30 giây)
1. Đăng nhập vào **Render Dashboard** và chọn service gặp sự cố (`brewlite-api` hoặc `brewlite-web`).
2. Chuyển sang tab **Deploys** ở menu bên trái.
3. Tìm bản triển khai liền trước có trạng thái ổn định và bấm nút **Rollback to this deploy**.
4. Hệ thống sẽ khôi phục ngay container cũ mà không cần chờ build lại.

### Cách 2: Hoàn tác commit qua Git & CI/CD
1. Trên máy cục bộ, hoàn tác commit gây lỗi trên nhánh `main` và đẩy lên GitHub:
   ```bash
   git checkout main
   git pull origin main
   git revert HEAD --no-edit
   git push origin main
   ```
2. GitHub Actions sẽ tự động kích hoạt lại pipeline để build, kiểm thử và triển khai bản mã nguồn ổn định đè lên Production.

### Cách 3: Triển khai lại từ Docker Image cũ trên Container Registry
1. Truy cập mục **Packages** trên trang GitHub của repository (`ghcr.io/sotsoatchamcom/brewlite-api` hoặc `brewlite-web`).
2. Sao chép tag `sha-<commit_ổn_định>` hoặc tag phiên bản phát hành trước đó (ví dụ: `v1.0.0`) để cấu hình triển khai lại image tương ứng.

---

## 9. Danh mục Endpoints & Tài khoản kiểm thử

### Các màn hình & Dịch vụ chính

| Tên màn hình / Dịch vụ | Địa chỉ Local | Địa chỉ Production (HTTPS) | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Trang chủ / Thực đơn** | `http://localhost:3000/shop` | `https://brewlite-web-n5o5.onrender.com/shop` | Chọn món, chọn size/topping, thêm giỏ hàng |
| **Đăng nhập / Đăng ký** | `http://localhost:3000/auth/login` | `https://brewlite-web-n5o5.onrender.com/auth/login` | Xác thực JWT, đăng ký tài khoản mới |
| **Thanh toán (Checkout)** | `http://localhost:3000/shop/checkout` | `https://brewlite-web-n5o5.onrender.com/shop/checkout` | Áp dụng voucher, quét VietQR thanh toán |
| **Lịch sử & Tiến trình đơn**| `http://localhost:3000/shop/orders` | `https://brewlite-web-n5o5.onrender.com/shop/orders` | Timeline 5 bước, thanh toán lại & hủy đơn |
| **Thẻ thành viên** | `http://localhost:3000/shop/profile` | `https://brewlite-web-n5o5.onrender.com/shop/profile` | Xem điểm Beans & hạng thành viên |
| **Swagger API Docs** | `http://localhost:3001/api/docs` | `https://brewlite-api-8lxn.onrender.com/api/docs` | Danh sách REST API & schema DTO |
| **Health Check API** | `http://localhost:3001/api/health` | `https://brewlite-api-8lxn.onrender.com/api/health` | Kiểm tra tình trạng hoạt động backend |

### Tài khoản kiểm thử mặc định (Seed Credentials)

| Loại tài khoản | Email đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@brewlite.com` | `Admin@2026` | Quản lý sản phẩm, đơn hàng, cập nhật pha chế |
| **Khách hàng mẫu (Customer)**| `customer@brewlite.com` | `Customer@2026` | Đặt hàng, thanh toán, hủy đơn, tích điểm |

---

## 10. Kịch bản kiểm thử & Trình diễn End-to-End (Demo Script)

1. **Kịch bản 1: Luồng đặt hàng & thanh toán chuẩn (Happy Path)**
  - Truy cập `/shop` -> Đăng nhập bằng tài khoản khách hàng -> Chọn thức uống cùng topping -> Vào Giỏ hàng và tiến hành Thanh toán.
  - Áp dụng mã giảm giá -> Mở popup VietQR -> Bấm **"Xác nhận đã chuyển khoản (Demo)"**.
  - Đơn chuyển sang trạng thái `PAID`, hiển thị trên Timeline tại `/shop/orders` và cộng điểm tích lũy Beans.

2. **Kịch bản 2: Luồng xử lý sự cố thanh toán lại & Hủy đơn (Robustness Flow)**
  - Tạo đơn hàng mới -> Tại popup VietQR, bấm **"Giả lập thanh toán thất bại (Demo)"**.
  - Truy cập `/shop/orders`, thẻ đơn hiển thị cảnh báo đỏ `PAYMENT_FAILED` kèm 2 nút **Hủy đơn** và **Thanh toán lại**.
  - Bấm **Thanh toán lại** để mở lại mã VietQR (có thể bấm **Xác nhận đã chuyển khoản** để thanh toán thành công hoặc bấm **Hủy đơn hàng này** để hủy đơn và tự động hoàn lại tồn kho/voucher).

3. **Kịch bản 3: Kiểm chứng tự động hóa & CI/CD**
  - Chạy `npm run test:robustness` tại `apps/api` để xác nhận 18/18 test case đạt trạng thái **PASSED**.
  - Kiểm tra tab **Actions** trên GitHub để theo dõi pipeline chạy tự động từ `Lint, Test & Build` đến `Smoke Test` trên môi trường Production.
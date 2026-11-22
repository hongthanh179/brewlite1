# Hướng Dẫn Cài Đặt, Kiểm Thử, Triển Khai và Rollback (Deployment Runbook) 

**Mục lục điều hướng (Bookmarks):**
- [1. Thông Tin Bàn Giao & Môi Trường Production](#1-thông-tin-bàn-giao--môi-trường-production)
- [2. Cấu Hình Biến Môi Trường (Environment Variables)](#2-cấu-hình-biến-môi-trường-environment-variables)
- [3. Hướng Dẫn Khởi Chạy Cục Bộ (Local Quick Start)](#3-hướng-dẫn-khởi-chạy-cục-bộ-local-quick-start)
- [4. Kiểm Thử Tự Động (Automated Testing)](#4-kiểm-thử-tự-động-automated-testing)
- [5. Kiến Trúc Triển Khai & Pipeline CI/CD](#5-kiến-trúc-triển-khai--pipeline-cicd)
- [6. Cơ Chế Khôi Phục Phiên Bản (Rollback Strategy)](#6-cơ-chế-khôi-phục-phiên-bản-rollback-strategy)

---

## 1. Thông Tin Bàn Giao & Môi Trường Production

| Hạng mục | Đường dẫn / Giá trị | Ghi chú |
| :--- | :--- | :--- |
| **Kho mã nguồn (Monorepo)** | `https://github.com/hongthanh179/brewlite1` | Cấu trúc gồm `apps/web`, `apps/api`, `docs/`, `tests/` |
| **Phiên bản phát hành (Release)** | `v1.0.0` (Commit `1b2e793`) | Đã đóng gói image lên GHCR và triển khai Production |
| **Frontend Storefront (HTTPS)** | `https://brewlite-web-n5o5.onrender.com/shop` | Giao diện Mobile-first / PWA cho Khách hàng & Admin |
| **Backend REST API (HTTPS)** | `https://brewlite-api-8lxn.onrender.com/api` | Tiền tố toàn cục `/api` |
| **Health Check Endpoint** | `https://brewlite-api-8lxn.onrender.com/api/health` | Trả về HTTP `200 OK` (`status: "ok"`, `database: "connected"`) |
| **Tài liệu Swagger UI** | `https://brewlite-api-8lxn.onrender.com/api/docs` | OpenAPI 3.0 tương tác trực tiếp kèm xác thực Bearer JWT |

---

## 2. Cấu Hình Biến Môi Trường (Environment Variables)

Hệ thống tuân thủ nguyên tắc 12-Factor App, tách biệt toàn bộ cấu hình khỏi mã nguồn. Không commit các tệp `.env` chứa giá trị thật lên kho mã nguồn.

| Biến môi trường | Ứng dụng | Nguồn cung cấp | Mô tả |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend (`apps/api`) | Local: `.env` / Render: `fromDatabase` (`brewlite-db`) | Chuỗi kết nối PostgreSQL 16 (Secret) |
| `JWT_SECRET` | Backend (`apps/api`) | Local: `.env` / Render: `generateValue: true` | Khóa bí mật ký và xác thực JWT Bearer Token |
| `NODE_ENV` | Backend & Frontend | `development` (Local) / `production` (Render) | Chế độ vận hành môi trường |
| `PORT` | Backend (`apps/api`) | Mặc định `3001` (Local) / Render tự cấp | Cổng lắng nghe của máy chủ NestJS |
| `RENDER_EXTERNAL_URL` | Backend (`apps/api`) | Render tự cung cấp | URL công khai dùng để ghi log khởi động trên Render |
| `NEXT_PUBLIC_API_URL` | Frontend (`apps/web`) | Local: `http://localhost:3001/api` / Render: nhập thủ công | URL gốc của Backend API (nhúng tại thời điểm build Next.js) |

---

## 3. Hướng Dẫn Khởi Chạy Cục Bộ (Local Quick Start)

### Cách 1: Chạy trọn gói bằng Docker Compose (Khuyên dùng)

Hệ thống điều phối 3 container trên mạng nội bộ `brewlite-net` (`postgres`, `api`, `web`) với cơ chế `healthcheck` đảm bảo thứ tự khởi động:

```bash
# 1. Clone kho mã nguồn và khởi tạo tệp biến môi trường từ mẫu
git clone [https://github.com/hongthanh179/brewlite1.git](https://github.com/hongthanh179/brewlite1.git)
cd brewlite1
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# 2. Xây dựng Docker image và khởi chạy ngầm 3 dịch vụ
docker compose up -d --build

# 3. Áp dụng Prisma Migration và nạp dữ liệu mẫu nhất quán
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

### Cách 2: Chạy trực tiếp trên môi trường Node.js 20

Yêu cầu cài đặt sẵn **Node.js v20+** và **Docker** (để chạy PostgreSQL 16):

```bash
# 1. Khởi động dịch vụ cơ sở dữ liệu PostgreSQL
docker compose up -d postgres

# 2. Cài đặt thư viện, sinh Prisma Client và chạy kiểm thử Backend
cd apps/api
npm install
npx prisma generate
npm run test:robustness && npm test && npm run lint

# 3. Chạy Migration, Seed dữ liệu mẫu và khởi động Backend (cổng 3001)
npx prisma migrate deploy
npx prisma db seed
npm run start:dev

# 4. Mở terminal mới, cài đặt và khởi động Frontend (cổng 3000)
cd ../web
npm install --legacy-peer-deps
npm run dev
```

### Danh Mục Truy Cập Cục Bộ & Tài Khoản Kiểm Thử Mặc Định

Dữ liệu mẫu (`apps/api/prisma/seed.ts`) sử dụng bộ sinh số giả ngẫu nhiên cố định (`state = 42`), tái tạo nhất quán 1 Admin, 4 Khách hàng, 3 Danh mục, 5 Topping, 4 Mã giảm giá (`WELCOME10`, `GIAM5K`, `EXPIRED10`, `HETLUOT`), 18 Sản phẩm và 45 Đơn hàng:

| Thành phần / Endpoint | Địa chỉ cục bộ | Thông tin đăng nhập / Kiểm tra |
| :--- | :--- | :--- |
| **Frontend Storefront (PWA)** | `http://localhost:3000/shop` | Khách hàng mẫu: `customer@brewlite.com` / `Customer@2026` |
| **Admin Portal** | `http://localhost:3000` | Quản trị viên: `admin@brewlite.com` / `Admin@2026` |
| **Swagger API Docs** | `http://localhost:3001/api/docs` | Dán JWT Token vào nút **Authorize** để kiểm thử API |
| **Health Check** | `http://localhost:3001/api/health` | Phản hồi HTTP `200 OK` (`"status": "ok"`, `"database": "connected"`) |

---

## 4. Kiểm Thử Tự Động (Automated Testing)

Hệ thống bao gồm **28 ca kiểm thử tự động** chia thành 3 tầng:

```bash
# 1. Unit Tests (4 suites, 21 tests: Khóa lạc quan, Idempotency, State Machine, Products)
cd apps/api
npm run test:robustness
npm test

# 2. Integration Tests (6 tests Supertest kết nối PostgreSQL thật)
npm run test:e2e

# 3. Mobile E2E Tests (Playwright trên viewport 390x844 - iPhone 14)
cd ../..
npx playwright test tests/e2e/checkout.spec.ts
```

---

## 5. Kiến Trúc Triển Khai & Pipeline CI/CD

### 5.1. Hạ tầng Production trên Render (`render.yml`)

Hạ tầng được khai báo theo mô hình Infrastructure as Code (Render Blueprint) trong tệp `render.yml`:
* **`brewlite-web`** (Web Service – Node Runtime): `rootDir: apps/web`, lệnh build `npm install --include=dev && npm run build`, lệnh chạy `npm run start`.
* **`brewlite-api`** (Web Service – Node Runtime): `rootDir: apps/api`, lệnh build `npm install --include=dev && npx prisma generate && npm run build`, lệnh chạy `npx prisma migrate deploy && npm run start:prod`, cấu hình `healthCheckPath: /api/health`.
* **`brewlite-db`** (PostgreSQL 16): Cơ sở dữ liệu `brewlite`, chỉ nhận kết nối nội bộ từ `brewlite-api`.

### 5.2. Quy trình Pipeline CI/CD (`.github/workflows/main.yml`)

1. **Job 1 – Quality Gate (`1. Lint, Test and Build`):** Kích hoạt trên mọi `push` (`main`, `develop`, `feat/**`) và `pull_request`. Dựng PostgreSQL 16 service container, chạy `prisma migrate deploy`, `prisma db seed`, kiểm tra cú pháp (`oxlint`, `eslint`), biên dịch TypeScript, chạy toàn bộ 21 Unit Tests, 6 Integration Tests và Playwright Mobile E2E. Chặn merge Pull Request nếu có bất kỳ bước nào thất bại.
2. **Job 2 – Docker Build & Push GHCR (`2. Docker Image & Push Registry`):** Khi merge vào `main` hoặc đẩy tag `v*`, đóng gói multi-stage Docker image cho `brewlite-api` và `brewlite-web`, đẩy lên GitHub Container Registry (`ghcr.io`) với 3 thẻ: short SHA (7 ký tự), full `github.sha` và `latest`.
3. **Job 3 – Deploy Production (`3. Deploy to Render Production`):** Gọi Render API lưu lại ID bản triển khai ổn định liền trước (`prev_api_deploy`, `prev_web_deploy`), sau đó kích hoạt triển khai qua `RENDER_API_DEPLOY_HOOK` và `RENDER_WEB_DEPLOY_HOOK`.
4. **Job 4 – Smoke Test & Rollback Guard (`4. Smoke Test & Rollback Guard`):**
   * Kiểm tra `GET ${PROD_API_URL}/api/health` (tối đa 10 lần, cách nhau 10 giây) xác nhận API và CSDL kết nối thông suốt.
   * Kiểm tra `GET ${PROD_API_URL}/api/products?limit=2` xác nhận phản hồi chứa `"statusCode":200`.
   * Kiểm tra `HEAD ${PROD_WEB_URL}/shop` xác nhận giao diện người dùng trả về HTTP `200`.

---

## 6. Cơ Chế Khôi Phục Phiên Bản (Rollback Strategy)

### 6.1. Rollback tự động trong Pipeline CD

Nếu bất kỳ kiểm tra nào trong bước **Smoke Test** thất bại (`if: failure()`), job tự động gọi Render Rollback API (`POST /v1/services/{id}/rollback`) để khôi phục cả `brewlite-api` và `brewlite-web` về đúng bản triển khai ổn định trước đó (`prev_api_deploy` và `prev_web_deploy`), đồng thời dừng pipeline với mã lỗi `exit 1`.

### 6.2. Rollback thủ công

Quản trị viên có thể khôi phục hệ thống tức thì qua 1 trong 3 cách sau:
1. **Trên Render Dashboard:** Truy cập dịch vụ `brewlite-api` / `brewlite-web` -> tab **Deploys** -> chọn bản triển khai ổn định gần nhất -> bấm **Rollback to this deploy**.
2. **Hoàn tác mã nguồn qua Git:**

```bash
git revert HEAD --no-edit
git push origin main
```

3. **Triển khai lại theo thẻ Image trên GHCR:** Sử dụng image đã lưu cố định theo mã commit `ghcr.io/hongthanh179/brewlite-api:sha-<commit>` hoặc tag phát hành `v1.0.0`.

### 6.3. Nguyên tắc an toàn Schema cơ sở dữ liệu

* Chỉ sử dụng `npx prisma migrate deploy` trên môi trường Production (tuyệt đối không dùng `prisma migrate reset` hay `prisma db push --force-reset`).
* Mọi thay đổi lược đồ đều tuân thủ nguyên tắc **tương thích ngược (backward-compatible)** theo quy trình 2 pha khi đổi tên hoặc xóa cột, đảm bảo phiên bản mã nguồn cũ vẫn hoạt động bình thường trên schema mới sau khi rollback ứng dụng mà không mất dữ liệu.

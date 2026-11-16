import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('BrewLite Checkout API (Integration Test)', () => {
    let accessToken: string;
    let productId: number;
    let createdOrderId: number;
    let createdOrderAmount: number;

    const uniqueSuffix = `${Date.now()}`.slice(-8);
    const testEmail = `e2e_${Date.now()}@brewlite.com`;
    const testPhone = `09${uniqueSuffix}`;
    const testPassword = 'Password@123';

    it('1. GET /api/health - Kiểm tra API và PostgreSQL hoạt động', async () => {
        const res = await request(API_BASE_URL)
            .get('/api/health')
            .expect(200);

        const payload = res.body?.data ?? res.body;
        expect(payload.status).toBe('ok');
        expect(payload.database).toBe('connected');
    });

    it('2. GET /api/products - Lấy danh sách thực đơn từ database', async () => {
        const res = await request(API_BASE_URL)
            .get('/api/products?limit=10')
            .expect(200);

        const payload = res.body?.data ?? res.body;
        const products = Array.isArray(payload) ? payload : payload?.data ?? [];
        expect(products.length).toBeGreaterThan(0);

        const available = products.find((p: any) => p.isActive !== false && (p.stock ?? 1) > 0);
        expect(available).toBeDefined();
        productId = available.id;
    });

    it('3. POST /api/auth/register & login - Đăng ký và nhận JWT Token', async () => {
        let regRes = await request(API_BASE_URL)
            .post('/api/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                name: 'Khách Kiểm Thử',
                phone: testPhone,
            });

        if (regRes.status === 400 && JSON.stringify(regRes.body).includes('phone')) {
            regRes = await request(API_BASE_URL)
                .post('/api/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    name: 'Khách Kiểm Thử',
                });
        }

        if (regRes.status !== 201) {
            throw new Error(`Register failed (${regRes.status}): ${JSON.stringify(regRes.body)}`);
        }

        const loginRes = await request(API_BASE_URL)
            .post('/api/auth/login')
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect([200, 201]).toContain(loginRes.status);
        const payload = loginRes.body?.data ?? loginRes.body;
        accessToken = payload.access_token || payload.accessToken || payload.token;
        expect(accessToken).toBeDefined();
    });

    it('4. POST /api/orders - Chặn nếu chưa đăng nhập (401) và cho phép tạo đơn khi có JWT (201)', async () => {
        await request(API_BASE_URL)
            .post('/api/orders')
            .send({
                items: [{ productId, size: 'M', quantity: 1 }],
            })
            .expect(401);

        const createRes = await request(API_BASE_URL)
            .post('/api/orders')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                items: [{ productId, size: 'M', quantity: 1 }],
            })
            .expect(201);

        const order = createRes.body?.data ?? createRes.body;
        expect(order.id).toBeDefined();
        expect(order.status).toBe('PENDING');
        createdOrderId = order.id;
        createdOrderAmount = Number(order.finalAmount ?? order.total ?? 35000);
    });

    it('5. POST /api/payments - Thanh toán thành công và chống trùng lặp Idempotency', async () => {
        const idempotencyKey = `int-test-${Date.now()}`;

        const payRes1 = await request(API_BASE_URL)
            .post('/api/payments')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('idempotency-key', idempotencyKey)
            .send({
                orderId: createdOrderId,
                method: 'WALLET',
                amount: createdOrderAmount,
                idempotencyKey,
                simulateFailure: false,
            })
            .expect(201);

        const result1 = payRes1.body?.data ?? payRes1.body;
        expect(result1).toBeDefined();
        const firstPaymentId = result1.payment?.id ?? result1.id;
        const isFirstPaid =
            result1.success === true ||
            result1.status === 'SUCCESS' ||
            result1.payment?.status === 'SUCCESS' ||
            result1.order?.status === 'PAID' ||
            firstPaymentId !== undefined;
        expect(isFirstPaid).toBe(true);

        // Gửi lại đúng request với cùng Idempotency-Key
        const payRes2 = await request(API_BASE_URL)
            .post('/api/payments')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('idempotency-key', idempotencyKey)
            .send({
                orderId: createdOrderId,
                method: 'WALLET',
                amount: createdOrderAmount,
                idempotencyKey,
                simulateFailure: false,
            });

        expect([200, 201]).toContain(payRes2.status);
        const result2 = payRes2.body?.data ?? payRes2.body;
        const secondPaymentId = result2.payment?.id ?? result2.id;
        const isIdempotent =
            result2.isDuplicate === true ||
            (firstPaymentId !== undefined && secondPaymentId === firstPaymentId);
        expect(isIdempotent).toBe(true);
    });
    it('6. GET /api/orders/me - Xác nhận đơn hàng đã chuyển sang trạng thái PAID', async () => {
        const historyRes = await request(API_BASE_URL)
            .get('/api/orders/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        const payload = historyRes.body?.data ?? historyRes.body;
        const orders = Array.isArray(payload) ? payload : payload?.data ?? [];
        const targetOrder = orders.find((o: any) => o.id === createdOrderId);
        expect(targetOrder).toBeDefined();
        expect(targetOrder.status).toBe('PAID');
    });
});
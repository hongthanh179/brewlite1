import { test, expect } from '@playwright/test';

test('Luồng End-to-End Mobile: Xem menu -> Chọn món -> Đăng nhập -> Thanh toán -> Xác nhận đơn', async ({ page }) => {
    const uniqueSuffix = `${Date.now()}`.slice(-8);
    const uniqueEmail = `customer_${Date.now()}@brewlite.com`;
    const uniquePhone = `09${uniqueSuffix}`;
    const password = 'Password@123';

    // 1. Mở trang thực đơn Mobile-First
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Thực đơn' })).toBeVisible();

    // 2. Bấm nút "+" của món đầu tiên còn hàng để mở CustomizeDialog
    const firstAddBtn = page.locator('button[aria-label^="Chọn món "]:not([disabled])').first();
    await expect(firstAddBtn).toBeVisible();
    await firstAddBtn.click();

    const addToCartBtn = page.getByRole('button', { name: /Thêm vào giỏ/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // 3. Mở thanh giỏ hàng nổi dưới đáy màn hình Mobile
    const floatingCartLink = page.getByRole('link', { name: /Xem giỏ hàng/i });
    await expect(floatingCartLink).toBeVisible();
    await floatingCartLink.click();
    await expect(page).toHaveURL(/\/shop\/cart/);

    // 4. Bấm Thanh toán -> chuyển hướng sang trang Đăng nhập
    await page.getByRole('button', { name: 'Thanh toán' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);

    // 5. Chuyển sang tab Đăng Ký và tạo tài khoản mới
    await page.getByRole('button', { name: 'Đăng Ký', exact: true }).click();
    await page.locator('#name').fill('Nguyễn Văn Kiểm Thử');
    await page.locator('#phone').fill(uniquePhone);
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Đăng Ký Thành Viên' }).click();

    // Hệ thống tự chuyển về tab Đăng Nhập và xóa ô mật khẩu -> nhập lại để đăng nhập
    const loginSubmitBtn = page.locator('form button[type="submit"]');
    await expect(loginSubmitBtn).toHaveText(/Đăng Nhập/);
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill(password);
    await loginSubmitBtn.click();

    // 6. Quay lại trang Checkout, chọn Thẻ ngân hàng và thanh toán
    await expect(page).toHaveURL(/\/shop\/checkout/);
    await page.getByRole('button', { name: /Thẻ ngân hàng/i }).click();

    const payCardBtn = page.locator('button:visible').filter({ hasText: /Thanh toán thẻ/i });
    await expect(payCardBtn).toBeVisible();
    await payCardBtn.click();

    // 7. Xác nhận màn hình đặt hàng thành công & theo dõi tiến trình đơn
    await expect(page).toHaveURL(/\/shop\/checkout\/success/);
    await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();
    await expect(page.getByText('Đã thanh toán')).toBeVisible();

    await page.getByRole('link', { name: /Theo dõi tiến trình đơn/i }).click();
    await expect(page).toHaveURL(/\/shop\/orders/);
    await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
});
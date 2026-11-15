import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

// Mock @nestjs/common để chặn Node nạp file Pure ESM
jest.mock('@nestjs/common', () => {
    class NotFoundException extends Error {
        constructor(message = 'Not Found') {
            super(message);
            this.name = 'NotFoundException';
        }
    }
    return {
        Injectable: () => (target: any) => target,
        Logger: class {
            log() {}
            warn() {}
            error() {}
        },
        NotFoundException,
        BadRequestException: class extends Error {},
        ConflictException: class extends Error {},
    };
});

describe('ProductsService (Task 4.3 MVP)', () => {
    let service: ProductsService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            product: {
                findMany: jest.fn(),
                count: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
            },
            $transaction: jest.fn((input: any) =>
                Array.isArray(input) ? Promise.all(input) : input(mockPrisma),
            ),
        };

        service = new ProductsService(mockPrisma);
    });

    it('trả về danh sách thực đơn và thông tin phân trang (GET /products)', async () => {
        const mockProducts = [
            {
                id: 1,
                name: 'Trà Lài Vải',
                price: 30000,
                isAvailable: true,
                isActive: true,
                sizes: [],
                toppings: [],
                category: { id: 1, name: 'Trà Trái Cây' },
            },
        ];
        (mockPrisma.product.count as any).mockResolvedValue(1);
        (mockPrisma.product.findMany as any).mockResolvedValue(mockProducts);

        const result = await service.findAll({ page: 1, limit: 20 });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
            id: 1,
            name: 'Trà Lài Vải',
            price: 30000,
        });
    });

    it('trả về chi tiết sản phẩm hợp lệ (GET /products/:id)', async () => {
        const mockProduct = {
            id: 32,
            name: 'Trà Lài Vải',
            price: 30000,
            isAvailable: true,
        };
        (mockPrisma.product.findFirst as any).mockResolvedValue(mockProduct);
        (mockPrisma.product.findUnique as any).mockResolvedValue(mockProduct);

        const result = await service.findOne(32);

        expect(result).toBeDefined();
        expect(result.name).toBe('Trà Lài Vải');
    });

    it('báo lỗi NotFoundException khi ID sản phẩm không tồn tại', async () => {
        (mockPrisma.product.findFirst as any).mockResolvedValue(null);
        (mockPrisma.product.findUnique as any).mockResolvedValue(null);

        await expect(service.findOne(9999)).rejects.toThrow(NotFoundException);
    });
});
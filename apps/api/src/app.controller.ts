import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health (Kiểm tra hệ thống)')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thông tin gốc của BrewLite REST API' })
  @ApiResponse({ status: 200, description: 'API đang hoạt động bình thường (200 OK)' })
  getApiRoot() {
    return {
      status: 'ok',
      service: 'BrewLite Cashless Ordering API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        products: '/api/products',
      },
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kiểm tra trạng thái vận hành của API và cơ sở dữ liệu' })
  @ApiResponse({ status: 200, description: 'Hệ thống vận hành bình thường (200 OK)' })
  @ApiResponse({ status: 503, description: 'CSDL mất kết nối (503 Service Unavailable)' })
  async checkHealth() {
    try {
      // Gửi truy vấn thăm dò thực tế vào PostgreSQL
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: '1.0.0',
      };
    } catch {
      // Khi postgres bị stop, lệnh queryRaw sẽ ném lỗi và nhảy vào đây
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        version: '1.0.0',
      });
    }
  }
}
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của API và PostgreSQL' })
    async check() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ok',
                database: 'up',
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
            };
        } catch {
            throw new ServiceUnavailableException({
                status: 'error',
                database: 'down',
                timestamp: new Date().toISOString(),
            });
        }
    }
}
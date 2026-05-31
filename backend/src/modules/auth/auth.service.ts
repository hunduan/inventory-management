import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: true, role: true },
    });

    if (!user || !bcrypt.compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    if (!user.enabled || !user.tenant.enabled) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role?.name || 'user' };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id, name: user.name, email: user.email,
        tenantId: user.tenantId, tenantName: user.tenant.name,
        role: user.role?.name || 'user',
        permissions: user.role?.permissions as string[] || [],
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) throw new ConflictException('邮箱已被注册');

    const tenantSlugTaken = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (tenantSlugTaken) throw new ConflictException('企业标识已被使用');

    const passwordHash = bcrypt.hashSync(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: dto.tenantName, slug: dto.tenantSlug } });

      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'admin',
          permissions: ['purchase.*', 'sale.*', 'inventory.*', 'product.*', 'report.*', 'setting.*'],
        },
      });

      const user = await tx.user.create({
        data: { tenantId: tenant.id, email: dto.email, passwordHash, name: dto.name, roleId: adminRole.id },
      });

      const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: 'admin' };

      return {
        accessToken: this.jwtService.sign(payload),
        user: { id: user.id, name: user.name, email: user.email, tenantId: tenant.id, tenantName: tenant.name, role: 'admin' },
      };
    });
  }
}

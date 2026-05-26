import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || (() => {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET not configured');
        }
        return 'dev-secret';
      })(),
    });
  }

  async validate(payload: { sub: string; email: string; tenantId: string; role: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, enabled: true },
      include: { tenant: true },
    });

    if (!user || !user.tenant.enabled) {
      throw new UnauthorizedException('账户已被禁用或不存在');
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Admin role bypasses permission checks
    if (user.role === 'admin') return true;

    // Fetch user's role permissions from DB
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.id, tenantId: user.tenantId },
      include: { role: true },
    });
    if (!dbUser?.role) return false;

    const userPermissions = dbUser.role.permissions as string[];
    return requiredPermissions.some((permission) =>
      userPermissions.some((ownedPermission) => this.matchesPermission(ownedPermission, permission)),
    );
  }

  private matchesPermission(ownedPermission: string, requiredPermission: string): boolean {
    if (ownedPermission === requiredPermission || ownedPermission === '*') return true;
    if (!ownedPermission.endsWith('.*')) return false;

    const namespace = ownedPermission.slice(0, -2);
    return requiredPermission === namespace || requiredPermission.startsWith(`${namespace}.`);
  }
}

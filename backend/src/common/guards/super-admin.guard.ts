import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('未登录');
    }
    if (user.email !== 'admin@demo.com') {
      throw new ForbiddenException('仅超级管理员可执行此操作');
    }
    return true;
  }
}

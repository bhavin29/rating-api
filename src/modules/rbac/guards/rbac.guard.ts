import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RBAC_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(RBAC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No permissions declared — allow through
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const userPermissions: string[] = req.user?.role?.permissions ?? [];

    // Wildcard grants everything (admin sessions)
    if (userPermissions.includes('*')) {
      return true;
    }

    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

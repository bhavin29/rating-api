import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AdminSession } from '../../database/entities';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminSession)
    private readonly adminSessionRepository: Repository<AdminSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const token = this.getBearerToken(req.headers?.authorization);

    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const session = await this.adminSessionRepository.findOne({
        where: { tokenHash },
      });

      if (session?.adminUser?.isActive && session.expiresAt.getTime() > Date.now()) {
        req.user = {
          id: session.adminUserId,
          role: { permissions: ['*'] },
          adminUser: session.adminUser,
        };
        return true;
      }
    }

    // Dev-only bypass: only active when AUTH_DISABLED=true AND not in production
    if (process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
      req.user = req.user ?? { id: 'auth-disabled', role: { permissions: ['*'] } };
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }

  private getBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice('Bearer '.length).trim() || null;
  }
}

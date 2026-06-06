import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AdminSession } from '../../database/entities';

@Injectable()
export class AdminHttpGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminSession)
    private readonly adminSessionRepository: Repository<AdminSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Dev-only bypass: consistent with UserAuthGuard
    if (process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization: string | undefined = request.headers?.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.adminSessionRepository.findOne({
      where: { tokenHash },
      relations: { adminUser: true },
    });

    if (!session?.adminUser?.isActive || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = { id: session.adminUserId, adminUser: session.adminUser };
    return true;
  }
}

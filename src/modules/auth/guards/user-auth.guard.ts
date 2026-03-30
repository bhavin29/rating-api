import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: { role: { permissions: true } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    req.user = user;
    return true;
  }
}

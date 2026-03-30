import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../../database/entities';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext().req;
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    const user = await this.dataSource.getRepository(User).findOne({
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

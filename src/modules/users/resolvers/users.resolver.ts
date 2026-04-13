import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, User } from '../../database/entities';
import { UserAuthGuard } from '../../auth/guards/user-auth.guard';
import { RbacGuard } from '../../rbac/guards/rbac.guard';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { UsersService } from '../services/users.service';

@Resolver(() => User)
@UseGuards(UserAuthGuard, RbacGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @RequirePermissions('user:read')
  getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  @Query(() => [Role])
  @RequirePermissions('user:read')
  getRoles(): Promise<Role[]> {
    return this.usersService.getRoles();
  }

  @Mutation(() => User)
  @RequirePermissions('user:create')
  createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.createUser(input);
  }

  @Mutation(() => User)
  @RequirePermissions('user:update')
  updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
    return this.usersService.updateUser(input);
  }
}

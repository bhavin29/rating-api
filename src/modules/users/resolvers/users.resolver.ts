import { UseGuards } from "@nestjs/common";
import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Role, User } from "../../database/entities";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { RbacGuard } from "../../rbac/guards/rbac.guard";
import { RequirePermissions } from "../../rbac/decorators/require-permissions.decorator";
import { CreateUserInput } from "../dto/create-user.input";
import { CreateUserPayload } from "../dto/create-user.payload";
import { DeleteUserInput } from "../dto/delete-user.input";
import { UpdateUserInput } from "../dto/update-user.input";
import { UserProjectSprintDataArgs } from "../dto/user-project-sprint-data.args";
import { UserProjectSprintData } from "../dto/user-project-sprint-data.output";
import { UsersService } from "../services/users.service";

@Resolver(() => User)
@UseGuards(UserAuthGuard, RbacGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  @RequirePermissions("user:read")
  getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  @Query(() => User)
  @RequirePermissions("user:read")
  getUser(@Args("userId") userId: string): Promise<User> {
    return this.usersService.getUser(userId);
  }

  @Query(() => [Role])
  @RequirePermissions("user:read")
  getRoles(): Promise<Role[]> {
    return this.usersService.getRoles();
  }

  @Query(() => [UserProjectSprintData])
  @RequirePermissions("user:read")
  getUserProjectSprintData(
    @Args() args: UserProjectSprintDataArgs,
  ): Promise<UserProjectSprintData[]> {
    return this.usersService.getUserProjectSprintData(args.userId);
  }

  @Mutation(() => CreateUserPayload)
  @RequirePermissions("user:create")
  createUser(
    @Args("input") input: CreateUserInput,
    @Context() context: any,
  ): Promise<CreateUserPayload> {
    return this.usersService.createUser(input, context.req.user.id);
  }

  @Mutation(() => User)
  @RequirePermissions("user:update")
  updateUser(
    @Args("input") input: UpdateUserInput,
    @Context() context: any,
  ): Promise<User> {
    return this.usersService.updateUser(input, context.req.user.id);
  }

  @Mutation(() => Boolean)
  @RequirePermissions("user:delete")
  deleteUser(
    @Args("input") input: DeleteUserInput,
    @Context() context: any,
  ): Promise<boolean> {
    return this.usersService.deleteUser(input, context.req.user.id);
  }
}

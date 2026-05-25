import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository } from "typeorm";
import { compare, hash } from "bcryptjs";
import { AuditAction } from "../../../common/enums";
import { AuditService } from "../../audit/services/audit.service";
import { Project, ProjectMember, Role, Skill, User, UserRole } from "../../database/entities";
import { generatePin } from "../../../common/security-pin.util";
import { TtlCache } from "../../../common/ttl-cache";
import { CreateRoleInput } from "../dto/create-role.input";
import { CreateUserInput } from "../dto/create-user.input";
import { CreateUserPayload } from "../dto/create-user.payload";
import { DeleteRoleInput } from "../dto/delete-role.input";
import { DeleteUserInput } from "../dto/delete-user.input";
import { UpdateRoleInput } from "../dto/update-role.input";
import { UpdateUserInput } from "../dto/update-user.input";
import { UserRoleInput } from "../dto/user-role.input";
import { UserProjectSprintData } from "../dto/user-project-sprint-data.output";

type UserProjectSprintDataRow = {
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  sprint_id: string;
  sprint_name: string;
  sprint_start_date: string;
  sprint_end_date: string;
  sprint_project_member_id: string;
};

@Injectable()
export class UsersService {
  private readonly rolesCache = new TtlCache<Promise<Role[]>>(60_000);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    private readonly dataSource: DataSource,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly auditService: AuditService,
  ) {}

  getUsers(): Promise<User[]> {
    return this.userRepository.find({
      order: { fullName: "ASC" },
      relations: { role: true, userRoles: { role: true, skill: true } },
    });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.getById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  getSkills(): Promise<Skill[]> {
    return this.skillRepository.find({ order: { name: 'ASC' } });
  }

  getRoles(): Promise<Role[]> {
    const cached = this.rolesCache.get("roles");
    if (cached) {
      return cached;
    }

    return this.rolesCache.set(
      "roles",
      this.roleRepository.find({ order: { name: "ASC" } }),
    );
  }

  async createRole(input: CreateRoleInput, actorId: string): Promise<Role> {
    const name = this.resolveRoleName(input.name);

    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });
    if (existingRole) {
      throw new ConflictException("Role with this name already exists");
    }

    const role = await this.roleRepository.save(
      this.roleRepository.create({ name }),
    );
    this.rolesCache.clear();

    await this.auditService.log(AuditAction.CREATE_ROLE, actorId, {
      roleId: role.id,
      name: role.name,
    });

    return role;
  }

  async updateRole(input: UpdateRoleInput, actorId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: input.roleId },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const name = this.resolveRoleName(input.name);

    if (name === role.name) {
      return role;
    }

    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });
    if (existingRole && existingRole.id !== role.id) {
      throw new ConflictException("Role with this name already exists");
    }

    const previousName = role.name;
    role.name = name;
    const updatedRole = await this.roleRepository.save(role);
    this.rolesCache.clear();

    await this.auditService.log(AuditAction.UPDATE_ROLE, actorId, {
      roleId: updatedRole.id,
      previousName,
      name: updatedRole.name,
    });

    return updatedRole;
  }

  async deleteRole(input: DeleteRoleInput, actorId: string): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id: input.roleId },
      relations: { users: true, questions: true },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.users?.length) {
      throw new BadRequestException("Cannot delete a role assigned to users");
    }

    if (role.questions?.length) {
      throw new BadRequestException("Cannot delete a role used by questions");
    }

    await this.roleRepository.remove(role);
    this.rolesCache.clear();
    await this.auditService.log(AuditAction.DELETE_ROLE, actorId, {
      roleId: input.roleId,
      name: role.name,
    });

    return true;
  }

  async getUserProjectSprintData(
    userId: string,
  ): Promise<UserProjectSprintData[]> {
    const rows = await this.dataSource.query<UserProjectSprintDataRow[]>(
      "SELECT * FROM public.generate_user_project_sprint_data($1)",
      [userId],
    );

    return rows.map((row) => ({
      userId: row.user_id,
      userName: row.user_name,
      projectId: row.project_id,
      projectName: row.project_name,
      sprintId: row.sprint_id,
      sprintName: row.sprint_name,
      sprintStartDate: row.sprint_start_date,
      sprintEndDate: row.sprint_end_date,
      sprintProjectMemberId: row.sprint_project_member_id,
    }));
  }

  getById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { role: true, userRoles: { role: true, skill: true } },
    });
  }

  private getByIdForMutation(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async createUser(
    input: CreateUserInput,
    actorId: string,
  ): Promise<CreateUserPayload> {
    const email = this.normalizeEmail(input.email);
    const fullName = this.resolveUserName(input.fullName, input.name);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const role = await this.roleRepository.findOne({
      where: { id: input.roleId },
    });
    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const plainPin = generatePin();
    const securityCodeHash = await hash(plainPin, 10);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        fullName,
        roleId: input.roleId,
        isActive: input.isActive ?? true,
        securityCodeHash,
        securityCodeEnabled: true,
        failedSecurityAttempts: 0,
      }),
    );

    if (input.userRoles?.length) {
      await this.saveUserRoles(user.id, input.userRoles);
    }

    if (input.projectId) {
      await this.ensureProjectExists(input.projectId);
      await this.addUserToProject(input.projectId, user.id);
    }

    await this.auditService.log(AuditAction.CREATE_USER, actorId, {
      userId: user.id,
      roleId: user.roleId,
      projectId: input.projectId ?? null,
      isActive: user.isActive,
    });

    const createdUser = await this.getById(user.id);
    if (!createdUser) {
      throw new NotFoundException("Created user not found");
    }

    return {
      user: createdUser,
      plainPin,
    };
  }

  async updateUser(input: UpdateUserInput, actorId: string): Promise<User> {
    const user = await this.getByIdForMutation(input.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const changes: Partial<User> = {};

    if (input.email !== undefined) {
      const email = this.normalizeEmail(input.email);
      if (email !== user.email) {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
          throw new ConflictException("User with this email already exists");
        }
        changes.email = email;
      }
    }

    if (input.fullName !== undefined || input.name !== undefined) {
      changes.fullName = this.resolveUserName(input.fullName, input.name);
    }

    if (input.roleId) {
      const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
      if (!role) {
        throw new NotFoundException("Role not found");
      }
      changes.roleId = input.roleId;
    }

    if (input.isActive !== undefined) {
      changes.isActive = input.isActive;
    }

    if (Object.keys(changes).length) {
      await this.userRepository.update(user.id, changes);
    }

    if (input.userRoles !== undefined) {
      await this.userRoleRepository.delete({ userId: user.id });
      if (input.userRoles.length) {
        await this.saveUserRoles(user.id, input.userRoles);
      }
    }

    await this.auditService.log(AuditAction.UPDATE_USER, actorId, {
      userId: user.id,
      roleId: changes.roleId ?? user.roleId,
      isActive: changes.isActive ?? user.isActive,
    });

    const updatedUser = await this.getById(user.id);
    return updatedUser!;
  }

  async deleteUser(input: DeleteUserInput, actorId: string): Promise<boolean> {
    const user = await this.getById(input.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.remove(user);
    await this.auditService.log(AuditAction.DELETE_USER, actorId, {
      userId: input.userId,
      roleId: user.roleId,
    });
    return true;
  }

  async seedSecurityPinsForExistingUsers(): Promise<
    Array<{ userId: string; pin: string }>
  > {
    const usersWithoutPin = await this.userRepository.find({
      where: { securityCodeHash: IsNull() },
    });
    const seededUsers: Array<{ userId: string; pin: string }> = [];

    for (const user of usersWithoutPin) {
      const pin = generatePin();
      user.securityCodeHash = await hash(pin, 10);
      user.securityCodeEnabled = true;
      user.failedSecurityAttempts = 0;
      user.securityLockedUntil = null;
      await this.userRepository.save(user);
      await this.auditService.log(AuditAction.GENERATE_SECURITY_PIN, user.id, {
        userId: user.id,
        reason: "seed_missing_pin",
      });
      seededUsers.push({ userId: user.id, pin });
    }

    return seededUsers;
  }

  async generateAndSaveSecurityPin(
    userId: string,
    actorId?: string,
  ): Promise<{ user: User; plainPin: string }> {
    const user = await this.getById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const plainPin = generatePin();
    user.securityCodeHash = await hash(plainPin, 10);
    user.securityCodeEnabled = true;
    user.failedSecurityAttempts = 0;
    user.securityLockedUntil = null;
    user.lastSecurityVerifiedAt = null;

    const updatedUser = await this.userRepository.save(user);
    await this.auditService.log(
      AuditAction.GENERATE_SECURITY_PIN,
      actorId ?? userId,
      {
        userId,
      },
    );

    return {
      user: updatedUser,
      plainPin,
    };
  }

  async verifySecurityPin(userId: string, inputPin: string): Promise<boolean> {
    const user = await this.getById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.securityCodeEnabled || !user.securityCodeHash) {
      throw new BadRequestException(
        "Security PIN is not enabled for this user",
      );
    }

    const now = new Date();
    if (user.securityLockedUntil && user.securityLockedUntil > now) {
      throw new BadRequestException(
        "Account is locked until " + user.securityLockedUntil.toISOString(),
      );
    }

    const isValid = await compare(inputPin, user.securityCodeHash);
    if (!isValid) {
      user.failedSecurityAttempts = (user.failedSecurityAttempts ?? 0) + 1;
      if (user.failedSecurityAttempts >= 5) {
        user.securityLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepository.save(user);
      return false;
    }

    user.failedSecurityAttempts = 0;
    user.securityLockedUntil = null;
    user.lastSecurityVerifiedAt = now;
    await this.userRepository.save(user);
    await this.auditService.log(AuditAction.VERIFY_SECURITY_PIN, userId, {
      userId,
    });
    return true;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private resolveUserName(fullName?: string, name?: string): string {
    const resolvedName = (name ?? fullName)?.trim();
    if (!resolvedName) {
      throw new BadRequestException("User name is required");
    }

    return resolvedName;
  }

  private resolveRoleName(name: string): string {
    const resolvedName = name.trim();
    if (!resolvedName) {
      throw new BadRequestException("Role name is required");
    }

    return resolvedName;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
  }

  private async saveUserRoles(
    userId: string,
    inputs: UserRoleInput[],
  ): Promise<void> {
    const roleIds = [...new Set(inputs.map((i) => i.roleId))];
    const roles = await this.roleRepository.findBy({ id: In(roleIds) });
    if (roles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    const skillIds = [
      ...new Set(inputs.filter((i) => i.skillId).map((i) => i.skillId!)),
    ];
    if (skillIds.length) {
      const skills = await this.skillRepository.findBy({ id: In(skillIds) });
      if (skills.length !== skillIds.length) {
        throw new NotFoundException('One or more skills not found');
      }
    }

    await this.userRoleRepository.save(
      inputs.map((input) =>
        this.userRoleRepository.create({
          userId,
          roleId: input.roleId,
          skillId: input.skillId ?? null,
          level: input.level ?? null,
        }),
      ),
    );
  }

  private async addUserToProject(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const existingMembership = await this.projectMemberRepository.findOne({
      where: { projectId, userId },
    });
    if (!existingMembership) {
      await this.projectMemberRepository.save(
        this.projectMemberRepository.create({
          projectId,
          userId,
          isActive: true,
        }),
      );
    }
  }
}

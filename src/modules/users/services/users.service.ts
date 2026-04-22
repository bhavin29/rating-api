import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectMember, Role, User } from '../../database/entities';
import { CreateUserInput } from '../dto/create-user.input';
import { DeleteUserInput } from '../dto/delete-user.input';
import { UpdateUserInput } from '../dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly projectMemberRepository: Repository<ProjectMember>,
  ) {}

  getUsers(): Promise<User[]> {
    return this.userRepository.find({ order: { fullName: 'ASC' } });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.getById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  getRoles(): Promise<Role[]> {
    return this.roleRepository.find({ order: { name: 'ASC' } });
  }

  getById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: { role: true } });
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const fullName = this.resolveUserName(input.fullName, input.name);

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        fullName,
        roleId: input.roleId,
        isActive: input.isActive ?? true,
      }),
    );

    if (input.projectId) {
      await this.ensureProjectExists(input.projectId);
      await this.addUserToProject(input.projectId, user.id);
    }

    const createdUser = await this.getById(user.id);
    if (!createdUser) {
      throw new NotFoundException('Created user not found');
    }

    return createdUser;
  }

  async updateUser(input: UpdateUserInput): Promise<User> {
    const user = await this.getById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const email = input.email !== undefined ? this.normalizeEmail(input.email) : undefined;

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = email;
    }

    if (input.fullName !== undefined || input.name !== undefined) {
      user.fullName = this.resolveUserName(input.fullName, input.name);
    }

    if (input.roleId) {
      const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
      if (!role) {
        throw new NotFoundException('Role not found');
      }
      user.roleId = input.roleId;
      user.role = role;
    }

    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    return this.userRepository.save(user);
  }

  async deleteUser(input: DeleteUserInput): Promise<boolean> {
    const user = await this.getById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
    return true;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private resolveUserName(fullName?: string, name?: string): string {
    const resolvedName = (name ?? fullName)?.trim();
    if (!resolvedName) {
      throw new BadRequestException('User name is required');
    }

    return resolvedName;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async addUserToProject(projectId: string, userId: string): Promise<void> {
    const existingMembership = await this.projectMemberRepository.findOne({ where: { projectId, userId } });
    if (!existingMembership) {
      await this.projectMemberRepository.save(this.projectMemberRepository.create({ projectId, userId, isActive: true }));
    }
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectMember, Role, User } from '../../database/entities';
import { CreateUserInput } from '../dto/create-user.input';
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

  getRoles(): Promise<Role[]> {
    return this.roleRepository.find({ order: { name: 'ASC' } });
  }

  getById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: { role: true } });
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: input.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.roleRepository.findOne({ where: { id: input.roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        email: input.email,
        fullName: input.fullName,
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

    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: input.email } });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = input.email;
    }

    if (input.fullName !== undefined) {
      user.fullName = input.fullName;
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

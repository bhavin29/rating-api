import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditAction } from '../../../common/enums';
import { Project, ProjectMember, User } from '../../database/entities';
import { AddProjectMembersInput } from '../dto/add-project-members.input';
import { CreateProjectInput } from '../dto/create-project.input';
import { RemoveProjectMemberInput } from '../dto/remove-project-member.input';
import { UpdateProjectMemberStatusInput } from '../dto/update-project-member-status.input';
import { AuditService } from '../../audit/services/audit.service';
import { UpdateProjectInput } from '../dto/update-project.input';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  getProjects(): Promise<Project[]> {
    return this.projectRepository.find({ order: { id: 'DESC' } });
  }

  async createProject(input: CreateProjectInput, actorId: string): Promise<Project> {
    const project = await this.projectRepository.save(this.projectRepository.create(input));
    await this.auditService.log(AuditAction.CREATE_PROJECT, actorId, { projectId: project.id });
    return project;
  }

  async updateProject(input: UpdateProjectInput, actorId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: input.projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.name = input.name;
    project.status = input.status;

    const updatedProject = await this.projectRepository.save(project);
    await this.auditService.log(AuditAction.UPDATE_PROJECT, actorId, { projectId: project.id });
    return updatedProject;
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    await this.ensureProjectExists(projectId);
    return this.projectMemberRepository.find({ where: { projectId } });
  }

  async addProjectMembers(input: AddProjectMembersInput): Promise<ProjectMember[]> {
    await this.ensureProjectExists(input.projectId);

    const users = await this.userRepository.findBy({ id: In(input.userIds) });
    if (users.length !== input.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const existing = await this.projectMemberRepository.find({ where: { projectId: input.projectId } });
    const existingUserIds = new Set(existing.map((member) => member.userId));

    const toInsert = input.userIds
      .filter((userId) => !existingUserIds.has(userId))
      .map((userId) => this.projectMemberRepository.create({ projectId: input.projectId, userId, isActive: true }));

    if (toInsert.length > 0) {
      await this.projectMemberRepository.save(toInsert);
    }

    return this.getProjectMembers(input.projectId);
  }

  async updateProjectMemberStatus(input: UpdateProjectMemberStatusInput): Promise<ProjectMember> {
    await this.ensureProjectExists(input.projectId);

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId: input.projectId, userId: input.userId },
    });

    if (!membership) {
      throw new NotFoundException('Project member not found');
    }

    membership.isActive = input.isActive;
    return this.projectMemberRepository.save(membership);
  }

  async removeProjectMember(input: RemoveProjectMemberInput): Promise<boolean> {
    await this.ensureProjectExists(input.projectId);

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId: input.projectId, userId: input.userId },
    });

    if (!membership) {
      throw new NotFoundException('Project member not found');
    }

    await this.projectMemberRepository.remove(membership);
    return true;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AuditAction } from "../../../common/enums";
import { Project, ProjectMember, Role, User } from "../../database/entities";
import { AddProjectMembersInput } from "../dto/add-project-members.input";
import { CreateProjectInput } from "../dto/create-project.input";
import { RemoveProjectMemberInput } from "../dto/remove-project-member.input";
import { UpdateProjectMemberStatusInput } from "../dto/update-project-member-status.input";
import { AuditService } from "../../audit/services/audit.service";
import { UpdateProjectInput } from "../dto/update-project.input";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    private readonly auditService: AuditService,
  ) {}

  getProjects(): Promise<Project[]> {
    return this.projectRepository.find({ order: { id: "DESC" } });
  }

  async createProject(
    input: CreateProjectInput,
    actorId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.save(
      this.projectRepository.create(input),
    );
    await this.auditService.log(AuditAction.CREATE_PROJECT, actorId, {
      projectId: project.id,
    });
    return project;
  }

  async updateProject(
    input: UpdateProjectInput,
    actorId: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: input.projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    project.name = input.name;
    project.status = input.status;

    const updatedProject = await this.projectRepository.save(project);
    await this.auditService.log(AuditAction.UPDATE_PROJECT, actorId, {
      projectId: project.id,
    });
    return updatedProject;
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    await this.ensureProjectExists(projectId);
    return this.projectMemberRepository.find({ where: { projectId } });
  }

  async addProjectMembers(
    input: AddProjectMembersInput,
    actorId: string,
  ): Promise<ProjectMember[]> {
    await this.ensureProjectExists(input.projectId);
    if (input.roleId != null) {
      await this.ensureRoleExists(input.roleId);
    }

    const users = await this.userRepository.findBy({ id: In(input.userIds) });
    if (users.length !== input.userIds.length) {
      throw new NotFoundException("One or more users not found");
    }

    const existing = await this.projectMemberRepository.find({
      where: { projectId: input.projectId },
    });
    const roleKey = input.roleId ?? null;
    const existingKeys = new Set(
      existing.map((m) => `${m.userId}:${m.roleId ?? 'null'}`),
    );

    const toInsert = input.userIds
      .filter((userId) => !existingKeys.has(`${userId}:${roleKey ?? 'null'}`))
      .map((userId) =>
        this.projectMemberRepository.create({
          projectId: input.projectId,
          userId,
          roleId: roleKey,
          isActive: true,
          allocationPercentage: input.allocationPercentage ?? 0,
        }),
      );

    if (toInsert.length > 0) {
      await this.projectMemberRepository.save(toInsert);
      await this.auditService.log(AuditAction.ADD_PROJECT_MEMBERS, actorId, {
        projectId: input.projectId,
        userIds: toInsert.map((member) => member.userId),
        roleId: roleKey,
      });
    }

    return this.getProjectMembers(input.projectId);
  }

  async updateProjectMemberStatus(
    input: UpdateProjectMemberStatusInput,
    actorId: string,
  ): Promise<ProjectMember> {
    if (
      input.isActive === undefined &&
      input.roleId === undefined &&
      input.allocationPercentage === undefined
    ) {
      throw new BadRequestException("No project member changes provided");
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { id: input.membershipId },
    });
    if (!membership) {
      throw new NotFoundException("Project member not found");
    }

    if (input.roleId !== undefined) {
      if (input.roleId !== null) {
        await this.ensureRoleExists(input.roleId);
      }
      membership.roleId = input.roleId;
    }

    if (input.isActive !== undefined) {
      membership.isActive = input.isActive;
    }

    if (input.allocationPercentage !== undefined) {
      membership.allocationPercentage = input.allocationPercentage;
    }

    const updatedMembership = await this.projectMemberRepository.save(membership);
    await this.auditService.log(AuditAction.UPDATE_PROJECT_MEMBER, actorId, {
      membershipId: updatedMembership.id,
      projectId: updatedMembership.projectId,
      userId: updatedMembership.userId,
      roleId: updatedMembership.roleId,
      isActive: updatedMembership.isActive,
    });
    return updatedMembership;
  }

  async removeProjectMember(
    input: RemoveProjectMemberInput,
    actorId: string,
  ): Promise<boolean> {
    const membership = await this.projectMemberRepository.findOne({
      where: { id: input.membershipId },
    });
    if (!membership) {
      throw new NotFoundException("Project member not found");
    }

    await this.projectMemberRepository.remove(membership);
    await this.auditService.log(AuditAction.REMOVE_PROJECT_MEMBER, actorId, {
      membershipId: input.membershipId,
      projectId: membership.projectId,
      userId: membership.userId,
      roleId: membership.roleId,
    });
    return true;
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
  }

  private async ensureRoleExists(roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
  }
}

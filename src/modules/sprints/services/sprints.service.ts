import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditAction } from '../../../common/enums';
import { Sprint, SprintMember, User } from '../../database/entities';
import { AuditService } from '../../audit/services/audit.service';
import { AddSprintMembersInput } from '../dto/add-sprint-members.input';
import { CreateSprintInput } from '../dto/create-sprint.input';
import { UpdateSprintInput } from '../dto/update-sprint.input';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint) private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(SprintMember) private readonly sprintMemberRepository: Repository<SprintMember>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  getSprints(projectId: string): Promise<Sprint[]> {
    return this.sprintRepository.find({ where: { projectId }, order: { startDate: 'DESC' } });
  }

  getSprintMembers(sprintId: string): Promise<SprintMember[]> {
    return this.sprintMemberRepository.find({ where: { sprintId } });
  }

  async createSprint(input: CreateSprintInput, actorId: string): Promise<Sprint> {
    this.validateSprintDateRange(input.startDate, input.endDate);
    const sprint = await this.sprintRepository.save(this.sprintRepository.create(input));
    await this.auditService.log(AuditAction.CREATE_SPRINT, actorId, { sprintId: sprint.id, projectId: input.projectId });
    return sprint;
  }

  async updateSprint(input: UpdateSprintInput): Promise<Sprint> {
    this.validateSprintDateRange(input.startDate, input.endDate);

    const sprint = await this.sprintRepository.findOne({ where: { id: input.sprintId } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    sprint.name = input.name;
    sprint.startDate = input.startDate;
    sprint.endDate = input.endDate;

    return this.sprintRepository.save(sprint);
  }

  async addSprintMembers(input: AddSprintMembersInput): Promise<SprintMember[]> {
    const users = await this.userRepository.findBy({ id: In(input.userIds) });
    if (users.length !== input.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const existing = await this.sprintMemberRepository.find({ where: { sprintId: input.sprintId } });
    const existingUserIds = new Set(existing.map((member) => member.userId));

    const toInsert = input.userIds
      .filter((userId) => !existingUserIds.has(userId))
      .map((userId) => this.sprintMemberRepository.create({ sprintId: input.sprintId, userId }));

    if (toInsert.length > 0) {
      await this.sprintMemberRepository.save(toInsert);
    }

    return this.getSprintMembers(input.sprintId);
  }

  private validateSprintDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
  }
}

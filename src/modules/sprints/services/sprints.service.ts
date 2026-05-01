import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditAction } from '../../../common/enums';
import { AuditLog, Project, Sprint, SprintMember, User } from '../../database/entities';
import { AuditService } from '../../audit/services/audit.service';
import { AddSprintMembersInput } from '../dto/add-sprint-members.input';
import { CreateSprintInput } from '../dto/create-sprint.input';
import { UpdateSprintInput } from '../dto/update-sprint.input';

@Injectable()
export class SprintsService {
  private sprintProjectColumnExists?: Promise<boolean>;
  private sprintMemberProjectColumnExists?: Promise<boolean>;

  constructor(
    @InjectRepository(Sprint) private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(SprintMember) private readonly sprintMemberRepository: Repository<SprintMember>,
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(AuditLog) private readonly auditLogRepository: Repository<AuditLog>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async getSprints(projectId: string): Promise<Sprint[]> {
    if (!(await this.hasSprintMemberProjectColumn())) {
      return this.sprintRepository.query(
        `
          SELECT id, name, start_date AS "startDate", end_date AS "endDate"
          FROM sprints
          WHERE project_id = $1
          ORDER BY start_date DESC
        `,
        [projectId],
      );
    }

    return this.sprintRepository
      .createQueryBuilder('sprint')
      .leftJoin('sprint_members', 'member', 'member.sprint_id = sprint.id AND member.project_id = :projectId', { projectId })
      .leftJoin(
        'audit_logs',
        'audit',
        "audit.action = :action AND audit.metadata->>'sprintId' = sprint.id AND audit.metadata->>'projectId' = :projectId",
        { action: AuditAction.CREATE_SPRINT, projectId },
      )
      .where('member.id IS NOT NULL OR audit.id IS NOT NULL')
      .distinct(true)
      .orderBy('sprint.start_date', 'DESC')
      .getMany();
  }

  async getSprintMembers(sprintId: string): Promise<SprintMember[]> {
    if (!(await this.hasSprintMemberProjectColumn())) {
      const members = await this.sprintMemberRepository.query(
        `
          SELECT sm.id, sm.sprint_id AS "sprintId", sm.user_id AS "userId", s.project_id AS "projectId"
          FROM sprint_members sm
          INNER JOIN sprints s ON s.id = sm.sprint_id
          WHERE sm.sprint_id = $1
        `,
        [sprintId],
      );

      return this.attachUsersToMembers(members);
    }

    return this.sprintMemberRepository.find({ where: { sprintId } });
  }

  async createSprint(input: CreateSprintInput, actorId: string): Promise<Sprint> {
    this.validateSprintDateRange(input.startDate, input.endDate);
    await this.ensureProjectExists(input.projectId);

    if (await this.hasSprintProjectColumn()) {
      const rows = await this.sprintRepository.query(
        `
          INSERT INTO sprints (name, start_date, end_date, project_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, start_date AS "startDate", end_date AS "endDate"
        `,
        [input.name, input.startDate, input.endDate, input.projectId],
      );

      const sprint = rows[0] as Sprint;
      await this.auditService.log(AuditAction.CREATE_SPRINT, actorId, { sprintId: sprint.id, projectId: input.projectId });
      return sprint;
    }

    const sprint = await this.sprintRepository.save(
      this.sprintRepository.create({
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );
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
    await this.ensureSprintExists(input.sprintId);

    const users = await this.userRepository.findBy({ id: In(input.userIds) });
    if (users.length !== input.userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const projectId = await this.resolveSprintProjectId(input);
    const existing = await this.getSprintMembers(input.sprintId);
    const existingUserIds = new Set(existing.map((member) => member.userId));

    const userIdsToInsert = input.userIds.filter((userId) => !existingUserIds.has(userId));

    if (userIdsToInsert.length > 0) {
      if (await this.hasSprintMemberProjectColumn()) {
        const toInsert = userIdsToInsert.map((userId) =>
          this.sprintMemberRepository.create({ sprintId: input.sprintId, projectId, userId }),
        );
        await this.sprintMemberRepository.save(toInsert);
      } else {
        for (const userId of userIdsToInsert) {
          await this.sprintMemberRepository.query(
            `
              INSERT INTO sprint_members (sprint_id, user_id)
              VALUES ($1, $2)
            `,
            [input.sprintId, userId],
          );
        }
      }
    }

    return this.getSprintMembers(input.sprintId);
  }

  private validateSprintDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async ensureSprintExists(sprintId: string): Promise<void> {
    const sprint = await this.sprintRepository.findOne({ where: { id: sprintId } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
  }

  private async resolveSprintProjectId(input: AddSprintMembersInput): Promise<string> {
    const inferredProjectId = await this.getInferredSprintProjectId(input.sprintId);

    if (input.projectId) {
      await this.ensureProjectExists(input.projectId);

      if (inferredProjectId && inferredProjectId !== input.projectId) {
        throw new BadRequestException('Sprint is already associated with a different project');
      }

      return input.projectId;
    }

    if (!inferredProjectId) {
      throw new BadRequestException('projectId is required when adding the first member to a sprint');
    }

    return inferredProjectId;
  }

  private async getInferredSprintProjectId(sprintId: string): Promise<string | null> {
    if (await this.hasSprintMemberProjectColumn()) {
      const existingMembership = await this.sprintMemberRepository.findOne({ where: { sprintId } });
      if (existingMembership?.projectId) {
        return existingMembership.projectId;
      }
    }

    if (await this.hasSprintProjectColumn()) {
      const rows = await this.sprintRepository.query(`SELECT project_id AS "projectId" FROM sprints WHERE id = $1`, [sprintId]);
      if (rows[0]?.projectId) {
        return rows[0].projectId as string;
      }
    }

    return this.getSprintProjectIdFromAudit(sprintId);
  }

  private async getSprintProjectIdFromAudit(sprintId: string): Promise<string | null> {
    const auditLogs = await this.auditLogRepository.find({
      where: { action: AuditAction.CREATE_SPRINT },
      order: { createdAt: 'DESC' },
    });

    for (const auditLog of auditLogs) {
      if (auditLog.metadata?.sprintId === sprintId && typeof auditLog.metadata.projectId === 'string') {
        return auditLog.metadata.projectId;
      }
    }

    return null;
  }

  private async attachUsersToMembers(
    members: Array<{ id: string; sprintId: string; userId: string; projectId: string }>,
  ): Promise<SprintMember[]> {
    if (members.length === 0) {
      return [];
    }

    const users = await this.userRepository.findBy({ id: In(members.map((member) => member.userId)) });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return members.map((member) => ({
      ...member,
      user: usersById.get(member.userId)!,
    })) as SprintMember[];
  }

  private hasSprintProjectColumn(): Promise<boolean> {
    this.sprintProjectColumnExists ??= this.hasColumn('sprints', 'project_id');
    return this.sprintProjectColumnExists;
  }

  private hasSprintMemberProjectColumn(): Promise<boolean> {
    this.sprintMemberProjectColumnExists ??= this.hasColumn('sprint_members', 'project_id');
    return this.sprintMemberProjectColumnExists;
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return rows.length > 0;
  }
}

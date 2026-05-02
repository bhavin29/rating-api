import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AuditAction } from "../../../common/enums";
import { Project, Sprint } from "../../database/entities";
import { AuditService } from "../../audit/services/audit.service";
import { CreateSprintInput } from "../dto/create-sprint.input";
import { UpdateSprintInput } from "../dto/update-sprint.input";

@Injectable()
export class SprintsService {
  private sprintProjectColumnExists?: Promise<boolean>;

  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async getSprints(projectId: string): Promise<Sprint[]> {
    if (await this.hasSprintProjectColumn()) {
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
      .createQueryBuilder("sprint")
      .innerJoin(
        "audit_logs",
        "audit",
        "audit.action = :action AND audit.metadata->>'sprintId' = sprint.id AND audit.metadata->>'projectId' = :projectId",
        { action: AuditAction.CREATE_SPRINT, projectId },
      )
      .distinct(true)
      .orderBy("sprint.start_date", "DESC")
      .getMany();
  }

  async createSprint(
    input: CreateSprintInput,
    actorId: string,
  ): Promise<Sprint> {
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
      await this.auditService.log(AuditAction.CREATE_SPRINT, actorId, {
        sprintId: sprint.id,
        projectId: input.projectId,
      });
      return sprint;
    }

    const sprint = await this.sprintRepository.save(
      this.sprintRepository.create({
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );
    await this.auditService.log(AuditAction.CREATE_SPRINT, actorId, {
      sprintId: sprint.id,
      projectId: input.projectId,
    });
    return sprint;
  }

  async updateSprint(input: UpdateSprintInput): Promise<Sprint> {
    this.validateSprintDateRange(input.startDate, input.endDate);

    const sprint = await this.sprintRepository.findOne({
      where: { id: input.sprintId },
    });
    if (!sprint) {
      throw new NotFoundException("Sprint not found");
    }

    sprint.name = input.name;
    sprint.startDate = input.startDate;
    sprint.endDate = input.endDate;

    return this.sprintRepository.save(sprint);
  }

  private validateSprintDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException("endDate must be on or after startDate");
    }
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
  }

  private hasSprintProjectColumn(): Promise<boolean> {
    this.sprintProjectColumnExists ??= this.hasColumn("sprints", "project_id");
    return this.sprintProjectColumnExists;
  }

  private async hasColumn(
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
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

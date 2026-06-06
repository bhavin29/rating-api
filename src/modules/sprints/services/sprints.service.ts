import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AuditAction } from "../../../common/enums";
import { Sprint } from "../../database/entities";
import { AuditService } from "../../audit/services/audit.service";
import { CreateSprintInput } from "../dto/create-sprint.input";
import { UpdateSprintInput } from "../dto/update-sprint.input";

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  getSprints(): Promise<Sprint[]> {
    return this.sprintRepository.find({ order: { startDate: "DESC" } });
  }

  async createSprint(
    input: CreateSprintInput,
    actorId: string,
  ): Promise<Sprint> {
    this.validateSprintDateRange(input.startDate, input.endDate);

    const sprint = await this.sprintRepository.save(
      this.sprintRepository.create({
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );

    await this.auditService.log(AuditAction.CREATE_SPRINT, actorId, {
      sprintId: sprint.id,
    });

    return sprint;
  }

  async updateSprint(
    input: UpdateSprintInput,
    actorId: string,
  ): Promise<Sprint> {
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

    const updatedSprint = await this.sprintRepository.save(sprint);
    await this.auditService.log(AuditAction.UPDATE_SPRINT, actorId, {
      sprintId: updatedSprint.id,
    });
    return updatedSprint;
  }

  async assignProjectMembersToSprint(
    sprintId: string,
    actorId: string,
  ): Promise<boolean> {
    try {
      await this.dataSource.query(
        `SELECT assign_project_members_to_sprint($1)`,
        [sprintId],
      );
      await this.auditService.log(
        AuditAction.ASSIGN_PROJECT_MEMBERS_TO_SPRINT,
        actorId,
        { sprintId },
      );
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to assign project members to sprint: ${error.message}`,
        );
      }
      throw new BadRequestException(
        "Failed to assign project members to sprint",
      );
    }
  }

  async generatePeerRatings(
    sprintId: string,
    actorId: string,
  ): Promise<boolean> {
    try {
      await this.dataSource.query(`SELECT generate_peer_ratings($1)`, [
        sprintId,
      ]);
      await this.auditService.log(AuditAction.GENERATE_PEER_RATINGS, actorId, {
        sprintId,
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to generate peer ratings: ${error.message}`,
        );
      }
      throw new BadRequestException("Failed to generate peer ratings");
    }
  }

  private validateSprintDateRange(startDate: string, endDate: string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException("endDate must be on or after startDate");
    }
  }
}

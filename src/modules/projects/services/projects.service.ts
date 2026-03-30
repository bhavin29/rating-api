import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../../../common/enums';
import { Project } from '../../database/entities';
import { CreateProjectInput } from '../dto/create-project.input';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectRepository: Repository<Project>,
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
}

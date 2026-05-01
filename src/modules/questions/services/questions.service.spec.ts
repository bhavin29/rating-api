import { NotFoundException } from '@nestjs/common';
import { Project, Question, Role, Sprint } from '../../database/entities';
import { QuestionsService } from './questions.service';

describe('QuestionsService project and sprint associations', () => {
  const questionId = '50000000-0000-0000-0000-000000000001';
  const roleId = '11111111-1111-1111-1111-111111111111';
  const projectId = '10000000-0000-0000-0000-000000000001';
  const sprintId = '30000000-0000-0000-0000-000000000001';

  const createRepository = () => ({
    create: jest.fn((entity) => entity),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
  });

  const createService = () => {
    const questionRepository = createRepository();
    const roleRepository = createRepository();
    const projectRepository = createRepository();
    const sprintRepository = createRepository();

    const service = new QuestionsService(
      questionRepository as any,
      roleRepository as any,
      projectRepository as any,
      sprintRepository as any,
    );

    return { projectRepository, questionRepository, roleRepository, service, sprintRepository };
  };

  it('creates a question with project and sprint associations', async () => {
    const { projectRepository, questionRepository, roleRepository, service, sprintRepository } = createService();

    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);
    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    sprintRepository.findOne.mockResolvedValue({ id: sprintId } as Sprint);

    await service.createQuestion({
      text: 'How well did this sprint go?',
      roleId,
      projectId,
      sprintId,
    });

    expect(questionRepository.create).toHaveBeenCalledWith({
      text: 'How well did this sprint go?',
      roleId,
      projectId,
      sprintId,
      isActive: true,
    });
  });

  it('creates a question without optional project and sprint associations', async () => {
    const { projectRepository, questionRepository, roleRepository, service, sprintRepository } = createService();

    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);

    await service.createQuestion({
      text: 'General role question',
      roleId,
    });

    expect(projectRepository.findOne).not.toHaveBeenCalled();
    expect(sprintRepository.findOne).not.toHaveBeenCalled();
    expect(questionRepository.create).toHaveBeenCalledWith({
      text: 'General role question',
      roleId,
      projectId: null,
      sprintId: null,
      isActive: true,
    });
  });

  it('updates project and sprint associations', async () => {
    const { projectRepository, questionRepository, roleRepository, service, sprintRepository } = createService();
    const question = { id: questionId, text: 'Question', roleId, projectId: null, sprintId: null } as Question;

    questionRepository.findOne.mockResolvedValue(question);
    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    sprintRepository.findOne.mockResolvedValue({ id: sprintId } as Sprint);
    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);

    const result = await service.updateQuestion({ id: questionId, projectId, sprintId });

    expect(result.projectId).toBe(projectId);
    expect(result.sprintId).toBe(sprintId);
  });

  it('clears project and sprint associations with null values', async () => {
    const { projectRepository, questionRepository, service, sprintRepository } = createService();
    const question = { id: questionId, text: 'Question', roleId, projectId, sprintId } as Question;

    questionRepository.findOne.mockResolvedValue(question);

    const result = await service.updateQuestion({ id: questionId, projectId: null, sprintId: null });

    expect(projectRepository.findOne).not.toHaveBeenCalled();
    expect(sprintRepository.findOne).not.toHaveBeenCalled();
    expect(result.projectId).toBeNull();
    expect(result.sprintId).toBeNull();
  });

  it('filters questions by project and sprint', async () => {
    const { questionRepository, service } = createService();

    await service.getQuestions({ projectId, sprintId, skip: 0, take: 20 });

    expect(questionRepository.find).toHaveBeenCalledWith({
      where: { projectId, sprintId },
      order: { text: 'ASC' },
      skip: 0,
      take: 20,
    });
  });

  it('rejects an invalid project id', async () => {
    const { projectRepository, roleRepository, service } = createService();

    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);
    projectRepository.findOne.mockResolvedValue(null);

    await expect(service.createQuestion({ text: 'Question', roleId, projectId })).rejects.toThrow(
      new NotFoundException('Project not found'),
    );
  });

  it('rejects an invalid sprint id', async () => {
    const { projectRepository, roleRepository, service, sprintRepository } = createService();

    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);
    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    sprintRepository.findOne.mockResolvedValue(null);

    await expect(service.createQuestion({ text: 'Question', roleId, projectId, sprintId })).rejects.toThrow(
      new NotFoundException('Sprint not found'),
    );
  });
});

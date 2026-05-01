import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Project, ProjectMember, Role, User } from '../../database/entities';
import { ProjectsService } from './projects.service';

describe('ProjectsService project member roles', () => {
  const projectId = '10000000-0000-0000-0000-000000000001';
  const userId = 'aaaaaaaa-1111-1111-1111-111111111111';
  const roleId = '11111111-1111-1111-1111-111111111111';

  const createRepository = () => ({
    create: jest.fn((entity) => entity),
    find: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
  });

  const createService = () => {
    const projectRepository = createRepository();
    const projectMemberRepository = createRepository();
    const userRepository = createRepository();
    const roleRepository = createRepository();
    const auditService = { log: jest.fn() };

    const service = new ProjectsService(
      projectRepository as any,
      projectMemberRepository as any,
      userRepository as any,
      roleRepository as any,
      auditService as any,
    );

    return { auditService, projectMemberRepository, projectRepository, roleRepository, service, userRepository };
  };

  it('adds project members with a validated role', async () => {
    const { projectMemberRepository, projectRepository, roleRepository, service, userRepository } = createService();
    const savedMembership = { projectId, userId, roleId, isActive: true } as ProjectMember;

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);
    userRepository.findBy.mockResolvedValue([{ id: userId } as User]);
    projectMemberRepository.find.mockResolvedValueOnce([]).mockResolvedValueOnce([savedMembership]);
    projectMemberRepository.save.mockResolvedValue([savedMembership]);

    const result = await service.addProjectMembers({ projectId, userIds: [userId], roleId });

    expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
    expect(projectMemberRepository.create).toHaveBeenCalledWith({ projectId, userId, roleId, isActive: true });
    expect(result).toEqual([savedMembership]);
  });

  it('keeps role optional when adding project members for existing clients', async () => {
    const { projectMemberRepository, projectRepository, roleRepository, service, userRepository } = createService();

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    userRepository.findBy.mockResolvedValue([{ id: userId } as User]);
    projectMemberRepository.find.mockResolvedValue([]);

    await service.addProjectMembers({ projectId, userIds: [userId] });

    expect(roleRepository.findOne).not.toHaveBeenCalled();
    expect(projectMemberRepository.create).toHaveBeenCalledWith({ projectId, userId, roleId: null, isActive: true });
  });

  it('updates a project member role without requiring a status change', async () => {
    const { projectMemberRepository, projectRepository, roleRepository, service } = createService();
    const membership = { projectId, userId, roleId: null, isActive: true } as ProjectMember;

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    projectMemberRepository.findOne.mockResolvedValue(membership);
    roleRepository.findOne.mockResolvedValue({ id: roleId } as Role);
    projectMemberRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await service.updateProjectMemberStatus({ projectId, userId, roleId });

    expect(result.roleId).toBe(roleId);
    expect(result.isActive).toBe(true);
  });

  it('clears a project member role when roleId is null', async () => {
    const { projectMemberRepository, projectRepository, roleRepository, service } = createService();
    const membership = { projectId, userId, roleId, isActive: true } as ProjectMember;

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    projectMemberRepository.findOne.mockResolvedValue(membership);
    projectMemberRepository.save.mockImplementation((entity) => Promise.resolve(entity));

    const result = await service.updateProjectMemberStatus({ projectId, userId, roleId: null });

    expect(roleRepository.findOne).not.toHaveBeenCalled();
    expect(result.roleId).toBeNull();
  });

  it('rejects project member updates without changes', async () => {
    const { projectRepository, service } = createService();

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);

    await expect(service.updateProjectMemberStatus({ projectId, userId })).rejects.toThrow(
      new BadRequestException('No project member changes provided'),
    );
  });

  it('rejects an invalid project member role', async () => {
    const { projectRepository, roleRepository, service } = createService();

    projectRepository.findOne.mockResolvedValue({ id: projectId } as Project);
    roleRepository.findOne.mockResolvedValue(null);

    await expect(service.addProjectMembers({ projectId, userIds: [userId], roleId })).rejects.toThrow(
      new NotFoundException('Role not found'),
    );
  });
});

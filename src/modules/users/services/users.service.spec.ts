import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction } from "../../../common/enums";
import { Role } from "../../database/entities";
import { UsersService } from "./users.service";

const createRepository = () => ({
  create: jest.fn((entity) => entity),
  findOne: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
});

describe("UsersService roles", () => {
  const roleId = "11111111-1111-1111-1111-111111111111";
  const actorId = "22222222-2222-2222-2222-222222222222";

  const createService = () => {
    const roleRepository = createRepository();
    const auditService = {
      log: jest.fn(),
    };

    const service = new UsersService(
      {} as any,
      roleRepository as any,
      {} as any,
      {} as any,
      {} as any,
      auditService as any,
    );

    return {
      auditService,
      roleRepository,
      service,
    };
  };

  it("creates a role", async () => {
    const { auditService, roleRepository, service } = createService();
    const role = { id: roleId, name: "Engineer" } as Role;

    roleRepository.findOne.mockResolvedValue(null);
    roleRepository.save.mockResolvedValue(role);

    const result = await service.createRole({ name: " Engineer " }, actorId);

    expect(result).toBe(role);
    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { name: "Engineer" },
    });
    expect(roleRepository.create).toHaveBeenCalledWith({ name: "Engineer" });
    expect(roleRepository.save).toHaveBeenCalledWith({ name: "Engineer" });
    expect(auditService.log).toHaveBeenCalledWith(
      AuditAction.CREATE_ROLE,
      actorId,
      {
        roleId,
        name: "Engineer",
      },
    );
  });

  it("rejects an empty role name when creating a role", async () => {
    const { roleRepository, service } = createService();

    await expect(service.createRole({ name: " " }, actorId)).rejects.toThrow(
      new BadRequestException("Role name is required"),
    );

    expect(roleRepository.findOne).not.toHaveBeenCalled();
    expect(roleRepository.save).not.toHaveBeenCalled();
  });

  it("rejects a duplicate role name when creating a role", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue({ id: roleId, name: "Engineer" });

    await expect(
      service.createRole({ name: "Engineer" }, actorId),
    ).rejects.toThrow(
      new ConflictException("Role with this name already exists"),
    );
  });

  it("renames a role", async () => {
    const { auditService, roleRepository, service } = createService();
    const role = { id: roleId, name: "Developer" } as Role;
    const updatedRole = { id: roleId, name: "Engineer" } as Role;

    roleRepository.findOne
      .mockResolvedValueOnce(role)
      .mockResolvedValueOnce(null);
    roleRepository.save.mockResolvedValue(updatedRole);

    const result = await service.updateRole(
      { roleId, name: " Engineer " },
      actorId,
    );

    expect(result).toBe(updatedRole);
    expect(roleRepository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: roleId },
    });
    expect(roleRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { name: "Engineer" },
    });
    expect(roleRepository.save).toHaveBeenCalledWith({
      id: roleId,
      name: "Engineer",
    });
    expect(auditService.log).toHaveBeenCalledWith(
      AuditAction.UPDATE_ROLE,
      actorId,
      {
        roleId,
        previousName: "Developer",
        name: "Engineer",
      },
    );
  });

  it("rejects an unknown role", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateRole({ roleId, name: "Engineer" }, actorId),
    ).rejects.toThrow(new NotFoundException("Role not found"));
  });

  it("rejects an empty role name", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue({ id: roleId, name: "Developer" });

    await expect(
      service.updateRole({ roleId, name: " " }, actorId),
    ).rejects.toThrow(new BadRequestException("Role name is required"));
  });

  it("rejects a duplicate role name", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne
      .mockResolvedValueOnce({ id: roleId, name: "Developer" })
      .mockResolvedValueOnce({
        id: "33333333-3333-3333-3333-333333333333",
        name: "Engineer",
      });

    await expect(
      service.updateRole({ roleId, name: "Engineer" }, actorId),
    ).rejects.toThrow(
      new ConflictException("Role with this name already exists"),
    );
  });

  it("deletes an unused role", async () => {
    const { auditService, roleRepository, service } = createService();
    const role = {
      id: roleId,
      name: "Engineer",
      users: [],
      questions: [],
    } as any;

    roleRepository.findOne.mockResolvedValue(role);
    roleRepository.remove.mockResolvedValue(role);

    const result = await service.deleteRole({ roleId }, actorId);

    expect(result).toBe(true);
    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { id: roleId },
      relations: { users: true, questions: true },
    });
    expect(roleRepository.remove).toHaveBeenCalledWith(role);
    expect(auditService.log).toHaveBeenCalledWith(
      AuditAction.DELETE_ROLE,
      actorId,
      {
        roleId,
        name: "Engineer",
      },
    );
  });

  it("rejects deleting an unknown role", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteRole({ roleId }, actorId)).rejects.toThrow(
      new NotFoundException("Role not found"),
    );
  });

  it("rejects deleting a role assigned to users", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue({
      id: roleId,
      name: "Engineer",
      users: [{ id: "33333333-3333-3333-3333-333333333333" }],
      questions: [],
    });

    await expect(service.deleteRole({ roleId }, actorId)).rejects.toThrow(
      new BadRequestException("Cannot delete a role assigned to users"),
    );

    expect(roleRepository.remove).not.toHaveBeenCalled();
  });

  it("rejects deleting a role used by questions", async () => {
    const { roleRepository, service } = createService();
    roleRepository.findOne.mockResolvedValue({
      id: roleId,
      name: "Engineer",
      users: [],
      questions: [{ id: "33333333-3333-3333-3333-333333333333" }],
    });

    await expect(service.deleteRole({ roleId }, actorId)).rejects.toThrow(
      new BadRequestException("Cannot delete a role used by questions"),
    );

    expect(roleRepository.remove).not.toHaveBeenCalled();
  });
});

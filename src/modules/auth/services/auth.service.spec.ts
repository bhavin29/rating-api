import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AdminUser } from '../../database/entities';
import { AuthService } from './auth.service';

const createRepository = () => ({
  create: jest.fn((entity) => entity),
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('AuthService admin login', () => {
  const createService = () => {
    const tokenRepository = createRepository();
    const adminUserRepository = createRepository();
    const adminSessionRepository = createRepository();
    const service = new AuthService(
      tokenRepository as any,
      adminUserRepository as any,
      adminSessionRepository as any,
    );

    return {
      adminSessionRepository,
      adminUserRepository,
      service,
    };
  };

  it('logs in an active admin with a valid password', async () => {
    const { adminSessionRepository, adminUserRepository, service } =
      createService();
    const adminUser = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      email: 'admin@example.com',
      fullName: 'Admin User',
      passwordHash: await hash('Admin@123', 10),
      isActive: true,
    } as AdminUser;
    adminUserRepository.findOne.mockResolvedValue(adminUser);
    adminSessionRepository.save.mockImplementation((session) =>
      Promise.resolve(session),
    );

    const result = await service.adminLogin({
      email: ' ADMIN@example.com ',
      password: 'Admin@123',
    });

    expect(result.adminUser).toBe(adminUser);
    expect(result.token).toHaveLength(64);
    expect(adminSessionRepository.create).toHaveBeenCalledWith({
      adminUserId: adminUser.id,
      tokenHash: service.hashToken(result.token),
      expiresAt: expect.any(Date),
    });
    expect(adminSessionRepository.save).toHaveBeenCalled();
    expect(adminUserRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
  });

  it('rejects an invalid admin password', async () => {
    const { adminUserRepository, service } = createService();
    adminUserRepository.findOne.mockResolvedValue({
      email: 'admin@example.com',
      passwordHash: await hash('Admin@123', 10),
      isActive: true,
    });

    await expect(
      service.adminLogin({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid admin credentials'));
  });

  it('rejects inactive admins', async () => {
    const { adminUserRepository, service } = createService();
    adminUserRepository.findOne.mockResolvedValue({
      email: 'admin@example.com',
      passwordHash: await hash('Admin@123', 10),
      isActive: false,
    });

    await expect(
      service.adminLogin({
        email: 'admin@example.com',
        password: 'Admin@123',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid admin credentials'));
  });
});

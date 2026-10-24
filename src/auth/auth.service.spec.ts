import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';

const make = (admin: unknown) => {
  const prisma = { adminUser: { findUnique: vi.fn().mockResolvedValue(admin) } };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed.token') };
  const config = { get: vi.fn().mockReturnValue('8h') };
  return { service: new AuthService(prisma as any, jwt as any, config as any), jwt };
};

describe('AuthService.login', () => {
  const hash = bcrypt.hashSync('correct-password', 4);
  const admin = { id: 1, email: 'a@b.co', name: 'Admin', passwordHash: hash };

  it('returns a token for valid credentials', async () => {
    const { service, jwt } = make(admin);
    const result = await service.login({ email: 'A@B.co', password: 'correct-password' });
    expect(result.accessToken).toBe('signed.token');
    expect(result.admin).toEqual({ id: 1, email: 'a@b.co', name: 'Admin' });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 1, email: 'a@b.co' });
  });

  it('rejects a wrong password', async () => {
    const { service } = make(admin);
    await expect(service.login({ email: 'a@b.co', password: 'wrong-password' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an unknown email with the same error', async () => {
    const { service } = make(null);
    await expect(service.login({ email: 'x@y.co', password: 'whatever123' })).rejects.toThrow(
      'Invalid email or password',
    );
  });
});

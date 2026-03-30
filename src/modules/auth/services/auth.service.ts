import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenType } from '../../../common/enums';
import { SecureToken } from '../../database/entities';
import { TokenValidationPayload } from '../dto/token-validation.payload';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(SecureToken) private readonly tokenRepository: Repository<SecureToken>) {}

  async generateMagicToken(userId: string, expiresInMinutes = 60): Promise<SecureToken> {
    const rawToken = randomBytes(32).toString('hex');
    const token = createHash('sha256').update(rawToken).digest('hex');

    return this.tokenRepository.save(
      this.tokenRepository.create({
        token,
        userId,
        type: TokenType.MAGIC_LINK,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
      }),
    );
  }

  async validateToken(token: string): Promise<TokenValidationPayload> {
    const tokenEntity = await this.tokenRepository.findOne({ where: { token, type: TokenType.MAGIC_LINK } });

    if (!tokenEntity) return { valid: false, reason: 'TOKEN_NOT_FOUND' };
    if (tokenEntity.isUsed) return { valid: false, reason: 'TOKEN_USED' };
    if (tokenEntity.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'TOKEN_EXPIRED' };

    return { valid: true, userId: tokenEntity.userId };
  }

  async consumeToken(token: string): Promise<SecureToken> {
    const tokenEntity = await this.tokenRepository.findOne({ where: { token, type: TokenType.MAGIC_LINK } });
    if (!tokenEntity || tokenEntity.isUsed || tokenEntity.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid token');
    }

    tokenEntity.isUsed = true;
    tokenEntity.usedAt = new Date();
    return this.tokenRepository.save(tokenEntity);
  }
}

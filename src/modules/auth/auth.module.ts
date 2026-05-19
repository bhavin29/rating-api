import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSession, AdminUser, SecureToken, User } from '../database/entities';
import { AuthService } from './services/auth.service';
import { AuthResolver } from './resolvers/auth.resolver';
import { UserAuthGuard } from './guards/user-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSession, AdminUser, SecureToken, User])],
  providers: [AuthService, AuthResolver, UserAuthGuard],
  exports: [AuthService, UserAuthGuard],
})
export class AuthModule {}

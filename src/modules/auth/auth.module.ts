import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSession, AdminUser, SecureToken, User } from '../database/entities';
import { AuthService } from './services/auth.service';
import { AuthResolver } from './resolvers/auth.resolver';
import { AdminHttpGuard } from './guards/admin-http.guard';
import { UserAuthGuard } from './guards/user-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminSession, AdminUser, SecureToken, User])],
  providers: [AuthService, AuthResolver, UserAuthGuard, AdminHttpGuard],
  exports: [AuthService, UserAuthGuard, AdminHttpGuard],
})
export class AuthModule {}

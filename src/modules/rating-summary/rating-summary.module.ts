import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSession } from '../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { RatingSummaryResolver } from './resolvers/rating-summary.resolver';
import { RatingSummaryService } from './services/rating-summary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminSession]),
    AuthModule,
    RbacModule,
  ],
  providers: [RatingSummaryResolver, RatingSummaryService],
  exports: [RatingSummaryService],
})
export class RatingSummaryModule {}

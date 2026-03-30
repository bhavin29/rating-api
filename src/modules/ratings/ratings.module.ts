import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AggregatedRating,
  OverallRating,
  Question,
  Rating,
  RatingAnswer,
  RatingRequest,
  SprintMember,
  User,
} from '../database/entities';
import { RatingsResolver } from './resolvers/ratings.resolver';
import { RatingsService } from './services/ratings.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      RatingAnswer,
      Question,
      User,
      SprintMember,
      RatingRequest,
      AggregatedRating,
      OverallRating,
    ]),
    AuthModule,
    EmailModule,
    AuditModule,
  ],
  providers: [RatingsResolver, RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}

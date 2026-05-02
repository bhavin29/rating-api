import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AggregatedRating,
  OverallRating,
  ProjectMember,
  Question,
  Rating,
  RatingAnswer,
  RatingRequest,
  Sprint,
  User,
} from "../database/entities";
import { RatingsResolver } from "./resolvers/ratings.resolver";
import { RatingsService } from "./services/ratings.service";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { RbacModule } from "../rbac/rbac.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rating,
      RatingAnswer,
      Question,
      User,
      Sprint,
      ProjectMember,
      RatingRequest,
      AggregatedRating,
      OverallRating,
    ]),
    AuthModule,
    RbacModule,
    EmailModule,
    AuditModule,
  ],
  providers: [RatingsResolver, RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}

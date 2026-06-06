import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminSession, SprintSpmStatus } from "../database/entities";
import { RatingsResolver } from "./resolvers/ratings.resolver";
import { RatingsService } from "./services/ratings.service";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { RbacModule } from "../rbac/rbac.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminSession, SprintSpmStatus]),
    AuthModule,
    RbacModule,
    AuditModule,
  ],
  providers: [RatingsResolver, RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}

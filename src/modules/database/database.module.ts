import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import databaseConfig from "./database.config";
import { UserRolesSkills1748000000000 } from "../../migrations/1748000000000-UserRolesSkills";
import { SeedProjectManagerSkill1748100000000 } from "../../migrations/1748100000000-SeedProjectManagerSkill";
import { ProjectMemberMultiRole1748200000000 } from "../../migrations/1748200000000-ProjectMemberMultiRole";
import {
  AdminSession,
  AdminUser,
  AggregatedRating,
  AuditLog,
  EmailLog,
  OverallRating,
  Project,
  ProjectMember,
  Question,
  Rating,
  RatingAnswer,
  RatingRequest,
  Role,
  SecureToken,
  Skill,
  Sprint,
  User,
  UserRole,
} from "./entities";

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>("database.url");
        const sslEnabled = configService.get<boolean>("database.ssl");

        return {
          type: "postgres",
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>("database.host", "localhost"),
                port: configService.get<number>("database.port", 5432),
                username: configService.get<string>(
                  "database.username",
                  "postgres",
                ),
                password: configService.get<string>(
                  "database.password",
                  "postgres",
                ),
                database: configService.get<string>("database.database", "srs"),
              }),
          synchronize: configService.get<boolean>(
            "database.synchronize",
            false,
          ),
          logging: configService.get<boolean>("database.logging", false),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          extra: {
            max: configService.get<number>("database.poolMax", 20),
            min: configService.get<number>("database.poolMin", 0),
            idleTimeoutMillis: configService.get<number>(
              "database.poolIdleTimeoutMillis",
              30000,
            ),
            connectionTimeoutMillis: configService.get<number>(
              "database.poolConnectionTimeoutMillis",
              5000,
            ),
          },
          migrations: [
            UserRolesSkills1748000000000,
            SeedProjectManagerSkill1748100000000,
            ProjectMemberMultiRole1748200000000,
          ],
          migrationsRun: true,
          entities: [
            AdminSession,
            AdminUser,
            Role,
            Skill,
            User,
            UserRole,
            Project,
            ProjectMember,
            Sprint,
            Question,
            RatingRequest,
            Rating,
            RatingAnswer,
            AggregatedRating,
            OverallRating,
            EmailLog,
            SecureToken,
            AuditLog,
          ],
        };
      },
    }),
  ],
})
export class DatabaseModule {}

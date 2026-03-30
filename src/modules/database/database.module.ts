import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from './database.config';
import {
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
  RolePermission,
  SecureToken,
  Sprint,
  SprintMember,
  User,
} from './entities';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('database.url');
        const sslEnabled = configService.get<boolean>('database.ssl');

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('database.host', 'localhost'),
                port: configService.get<number>('database.port', 5432),
                username: configService.get<string>('database.username', 'postgres'),
                password: configService.get<string>('database.password', 'postgres'),
                database: configService.get<string>('database.database', 'srs'),
              }),
          synchronize: configService.get<boolean>('database.synchronize', false),
          logging: configService.get<boolean>('database.logging', false),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          entities: [
            Role,
            RolePermission,
            User,
            Project,
            ProjectMember,
            Sprint,
            SprintMember,
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

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
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
} from './modules/database/entities';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'srs',
      synchronize: false,
      logging: false,
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
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      context: ({ req }) => ({ req }),
      sortSchema: true,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    SprintsModule,
    QuestionsModule,
    RatingsModule,
    EmailModule,
    AuditModule,
    RbacModule,
  ],
})
export class AppModule {}

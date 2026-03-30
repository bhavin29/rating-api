import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { QuestionsResolver } from './resolvers/questions.resolver';
import { QuestionsService } from './services/questions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question]), AuthModule, RbacModule],
  providers: [QuestionsResolver, QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

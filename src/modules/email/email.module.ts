import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from '../database/entities';
import { EmailService } from './services/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

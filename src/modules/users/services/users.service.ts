import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  getById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: { role: true } });
  }
}

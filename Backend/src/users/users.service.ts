import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  create(payload: CreateUserDto): User {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: payload.email,
      name: payload.name,
      active: payload.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`usuario ${id} no encontrado`);
    }
    return user;
  }

  update(id: string, payload: UpdateUserDto): User {
    const user = this.findOne(id);
    if (payload.email !== undefined) {
      user.email = payload.email;
    }
    if (payload.name !== undefined) {
      user.name = payload.name;
    }
    if (payload.active !== undefined) {
      user.active = payload.active;
    }
    user.updatedAt = new Date();
    return user;
  }

  remove(id: string): void {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException(`usuario ${id} no encontrado`);
    }
    this.users.splice(index, 1);
  }
}

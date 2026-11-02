import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../auth/auth-user';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  /**
   * Records every authenticated user. The table is the only source of truth for
   * "who is an administrator", so notifications can be addressed to admins who
   * have logged in at least once.
   */
  async touch(user: AuthUser): Promise<void> {
    await this.users.upsert(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        lastSeenAt: new Date(),
      },
      ['id'],
    );
  }

  async findAdminIds(manager?: EntityManager): Promise<string[]> {
    const repository = manager ? manager.getRepository(UserEntity) : this.users;
    const admins = await repository.find({
      where: { isAdmin: true },
      select: { id: true },
    });
    return admins.map((admin) => admin.id);
  }
}

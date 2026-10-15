import { AppError } from '../../shared/errors/app-error.js';
import type { users } from '../../shared/database/schema.js';
import type { z } from 'zod';
import type { profileSchema } from './user.schema.js';
import { UserRepository } from './user.repository.js';
export function userDto(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    designation: user.designation,
    teamDepartment: user.teamDepartment,
    profileImage: user.profileImage,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
export class UserService {
  constructor(private repository: UserRepository) {}
  async get(id: string) {
    const user = await this.repository.find(id);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.');
    return userDto(user);
  }
  async update(id: string, input: z.infer<typeof profileSchema>) {
    const user = await this.repository.update(id, input);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.');
    return userDto(user);
  }
}

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AssessorProfile } from './entities/assessor-profile.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole as UserRoleLink } from './entities/user-role.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AssessorProfile,
      UserProfile,
      Role,
      UserRoleLink,
      BankAccount,
    ]),
    AuditLogsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

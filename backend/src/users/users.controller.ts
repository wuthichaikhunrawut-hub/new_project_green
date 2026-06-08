import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  Headers,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN', 'ASSESSOR_ADMIN')
  findAll(@Query('role') role?: string, @Headers() headers?: any) {
    const orgIdStr = headers['x-org-id'];
    const userRole = headers['x-user-role'] || '';

    // If ORG_ADMIN, force filter by their organization
    if (
      ['Organization Admin', 'ORG_ADMIN', 'ORGANIZATION_ADMIN'].some((r) =>
        String(userRole).includes(r),
      )
    ) {
      const orgId = parseInt(orgIdStr, 10);
      if (!isNaN(orgId)) {
        return this.usersService.findAll(role, orgId);
      }
    }

    // Otherwise (System Admin), return all or filtered by role
    return this.usersService.findAll(role);
  }

  @Get('roles')
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  getAllRoles() {
    return this.usersService.getAllRoles();
  }

  // Profile endpoints
  @Get('profile/me')
  getProfile(@Headers('x-user-id') userId: string) {
    return this.usersService.findOne(+userId);
  }

  @Patch('profile/me')
  updateProfile(@Headers('x-user-id') userId: string, @Body() updateData: any) {
    return this.usersService.update(+userId, updateData);
  }

  @Post('profile/goals')
  setPersonalGoal(@Headers('x-user-id') userId: string, @Body() body: { targetReductionPercent: number }) {
    return this.usersService.setPersonalGoal(+userId, body.targetReductionPercent);
  }

  @Post()
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Post('bulk-import')
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new ForbiddenException('No file uploaded');
    const orgId = req.user?.orgId;
    if (!orgId) throw new ForbiddenException('Organization not found for current user');
    
    const csvContent = file.buffer.toString('utf-8');
    const importedCount = await this.usersService.bulkImportUsers(orgId, csvContent);
    return { success: true, count: importedCount };
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    const requestingUser = req.user;
    if (requestingUser && (requestingUser.role === 'ORGANIZATION_ADMIN' || requestingUser.role === 'ORG_ADMIN')) {
      const targetUser = await this.usersService.findOne(+id);
      if (!targetUser || targetUser.organization?.id !== requestingUser.orgId) {
        throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขผู้ใช้งานนอกองค์กร');
      }
    }
    return this.usersService.update(+id, updateUserDto);
  }


  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'ORGANIZATION_ADMIN')
  async remove(@Param('id') id: string, @Req() req: any) {
    const requestingUser = req.user;
    if (requestingUser && (requestingUser.role === 'ORGANIZATION_ADMIN' || requestingUser.role === 'ORG_ADMIN')) {
      const targetUser = await this.usersService.findOne(+id);
      if (!targetUser || targetUser.organization?.id !== requestingUser.orgId) {
        throw new ForbiddenException('ไม่มีสิทธิ์ลบผู้ใช้งานนอกองค์กร');
      }
    }
    return this.usersService.remove(+id);
  }
}



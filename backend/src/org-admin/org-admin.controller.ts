import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrgAdminService } from './org-admin.service';
import { SendToUserDto } from './dto/send-to-user.dto';
import { ResubmitRevisionDto } from './dto/resubmit-revision.dto';

interface JwtUser {
  sub: number;
  email: string;
  role: string;
  orgId?: number;
}

@Controller('org-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZATION_ADMIN', 'ORG_ADMIN', 'SYSTEM_ADMIN')
export class OrgAdminController {
  constructor(private readonly orgAdminService: OrgAdminService) {}

  private orgId(req: { user: JwtUser }): number {
    return Number(req.user.orgId ?? 0);
  }

  @Get('revision-center')
  getRevisionCenter(@Request() req: { user: JwtUser }) {
    return this.orgAdminService.getRevisionCenter(this.orgId(req));
  }

  @Patch('revision-center/:id/send-to-user')
  sendToUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendToUserDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.orgAdminService.sendToUser(id, this.orgId(req), dto);
  }

  @Patch('revision-center/:id/resubmit')
  resubmit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResubmitRevisionDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.orgAdminService.resubmitRevision(id, this.orgId(req), dto);
  }
}

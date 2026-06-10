import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Headers,
  Logger,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CarbonLogsService } from './carbon-logs.service';
import { CreateCarbonLogDto } from './dto/create-carbon-log.dto';
import { UpdateCarbonLogDto } from './dto/update-carbon-log.dto';

@Controller('carbon-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarbonLogsController {
  private readonly logger = new Logger(CarbonLogsController.name);

  constructor(private readonly carbonLogsService: CarbonLogsService) {}

  private getOrgId(headers: Record<string, string | undefined>): number {
    const orgIdStr = headers['x-org-id'];
    if (!orgIdStr || orgIdStr === 'undefined' || orgIdStr === 'null') {
      throw new BadRequestException('ไม่พบค่า x-org-id');
    }
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) {
      throw new BadRequestException('ค่า x-org-id ไม่ถูกต้อง');
    }
    return orgId;
  }

  @Post()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER')
  create(
    @Body() createDto: CreateCarbonLogDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.carbonLogsService.create(createDto, this.getOrgId(headers));
  }

  @Get('trend')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
  getTrend(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const startDate = req.query?.startDate as string | undefined;
    const endDate = req.query?.endDate as string | undefined;
    return this.carbonLogsService.getCarbonTrend(this.getOrgId(headers), startDate, endDate);
  }

  @Get('personal-dashboard')
  @Roles('USER', 'ORG_ADMIN', 'EMPLOYEE')
  getPersonalDashboard(@Request() req: any) {
    const userId = Number(req.user.sub);
    const orgId = req.user.orgId ? Number(req.user.orgId) : undefined;
    return this.carbonLogsService.getPersonalDashboard(userId, orgId);
  }

  @Get()
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER', 'ASSESSOR', 'ASSESSOR_ADMIN')
  findAll(@Headers() headers: Record<string, string | undefined>) {
    this.logger.log(`Executing findAll for orgId: ${this.getOrgId(headers)}`);
    return this.carbonLogsService.findAll(this.getOrgId(headers));
  }

  @Patch(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCarbonLogDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.carbonLogsService.update(
      parseInt(id, 10),
      this.getOrgId(headers),
      updateDto,
    );
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN', 'ORG_ADMIN', 'USER')
  remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    this.logger.log(
      `Executing remove for id: ${id}, orgId: ${this.getOrgId(headers)}`,
    );
    return this.carbonLogsService.remove(
      parseInt(id, 10),
      this.getOrgId(headers),
    );
  }
}

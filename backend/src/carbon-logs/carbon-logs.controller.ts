import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Headers,
  UnauthorizedException,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { CarbonLogsService } from './carbon-logs.service';
import { CreateCarbonLogDto } from './dto/create-carbon-log.dto';

@Controller('carbon-logs')
export class CarbonLogsController {
  private readonly logger = new Logger(CarbonLogsController.name);

  constructor(private readonly carbonLogsService: CarbonLogsService) {}

  // Helper to extract mock Org ID for now
  private getOrgId(headers: any): number {
    const orgIdStr = headers['x-org-id'];
    this.logger.log(`[getOrgId] Received x-org-id header: ${orgIdStr}`);

    // Workaround: ป้องกัน Frontend ค้างจาก Error 401 ในกรณีที่ User ไม่มี/ไม่ได้ส่ง x-org-id มา
    if (!orgIdStr || orgIdStr === 'undefined' || orgIdStr === 'null') {
      this.logger.warn(
        '[getOrgId] x-org-id is missing or invalid. Returning 0.',
      );
      return 0;
    }
    const orgId = parseInt(orgIdStr, 10);
    if (isNaN(orgId)) {
      this.logger.warn(
        `[getOrgId] Failed to parse x-org-id: "${orgIdStr}". Returning 0.`,
      );
      return 0;
    }
    return orgId;
  }

  @Post()
  create(@Body() createDto: CreateCarbonLogDto, @Headers() headers: any) {
    return this.carbonLogsService.create(createDto, this.getOrgId(headers));
  }

  @Get()
  findAll(@Headers() headers: any) {
    this.logger.log(`Executing findAll for orgId: ${this.getOrgId(headers)}`);
    return this.carbonLogsService.findAll(this.getOrgId(headers));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() headers: any) {
    this.logger.log(
      `Executing remove for id: ${id}, orgId: ${this.getOrgId(headers)}`,
    );
    return this.carbonLogsService.remove(
      parseInt(id, 10),
      this.getOrgId(headers),
    );
  }
}

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
} from '@nestjs/common';
import { CarbonLogsService } from './carbon-logs.service';
import { CreateCarbonLogDto } from './dto/create-carbon-log.dto';
import { UpdateCarbonLogDto } from './dto/update-carbon-log.dto';

@Controller('carbon-logs')
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
  create(
    @Body() createDto: CreateCarbonLogDto,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    return this.carbonLogsService.create(createDto, this.getOrgId(headers));
  }

  @Get()
  findAll(@Headers() headers: Record<string, string | undefined>) {
    this.logger.log(`Executing findAll for orgId: ${this.getOrgId(headers)}`);
    return this.carbonLogsService.findAll(this.getOrgId(headers));
  }

  @Patch(':id')
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

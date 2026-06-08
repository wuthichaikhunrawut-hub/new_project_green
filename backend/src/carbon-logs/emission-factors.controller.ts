import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmissionFactorsService } from './emission-factors.service';
import { EmissionFactor } from './entities/emission-factor.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/emission-factors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmissionFactorsController {
  constructor(
    private readonly emissionFactorsService: EmissionFactorsService,
  ) {}

  @Get()
  findAll() {
    return this.emissionFactorsService.findAll();
  }

  @Post()
  @Roles('SYSTEM_ADMIN')
  create(@Body() data: Partial<EmissionFactor>) {
    return this.emissionFactorsService.create(data);
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN')
  update(@Param('id') id: string, @Body() data: Partial<EmissionFactor>) {
    return this.emissionFactorsService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN')
  remove(@Param('id') id: string) {
    return this.emissionFactorsService.remove(parseInt(id, 10));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationUnit } from './entities/organization-unit.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(OrganizationUnit)
    private orgUnitRepository: Repository<OrganizationUnit>,
  ) {}

  async create(orgData: any): Promise<Organization> {
    const org = this.orgRepository.create(orgData);
    return this.orgRepository.save(org as any) as Promise<Organization>;
  }

  async findOne(id: number): Promise<Organization | null> {
    return this.orgRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async findAll(): Promise<any[]> {
    const orgs = await this.orgRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.users', 'users')
      .orderBy('org.name', 'ASC')
      .getMany();

    return orgs.map((org) => ({
      ...org,
      userCount: org.users ? org.users.length : 0,
    }));
  }

  async update(id: number, updateData: any): Promise<Organization | null> {
    await this.orgRepository.update(id, updateData);
    return this.findOne(id);
  }

  // --- Organization Units ---

  async createUnit(
    orgId: number,
    unitData: Partial<OrganizationUnit>,
  ): Promise<OrganizationUnit> {
    const unit = this.orgUnitRepository.create({ ...unitData, org_id: orgId });
    return this.orgUnitRepository.save(unit);
  }

  async findUnitsByOrg(orgId: number): Promise<OrganizationUnit[]> {
    return this.orgUnitRepository.find({
      where: { org_id: orgId },
      relations: ['parent_unit'],
      order: { created_at: 'ASC' },
    });
  }

  async updateUnit(
    unitId: number,
    updateData: Partial<OrganizationUnit>,
  ): Promise<OrganizationUnit | null> {
    await this.orgUnitRepository.update(unitId, updateData);
    return this.orgUnitRepository.findOne({
      where: { id: unitId },
      relations: ['parent_unit'],
    });
  }

  async removeUnit(unitId: number): Promise<void> {
    await this.orgUnitRepository.delete(unitId);
  }

  async getAnnualReport(orgId: number) {
    const org = await this.findOne(orgId);
    if (!org) return null;

    const currentYear = new Date().getFullYear();
    const baseYear = org.base_year || currentYear - 1;

    // Sum of emissions for current year
    const currentYearLog = await this.orgRepository.manager
      .createQueryBuilder('CarbonLog', 'log')
      .where('log.org_id = :orgId', { orgId })
      .andWhere('log.year = :year', { year: currentYear })
      .select('SUM(log.total_emission)', 'total')
      .getRawOne();
    const currentYearEmissions = Number(currentYearLog?.total || 0);

    // Sum of emissions for base year
    const baseYearLog = await this.orgRepository.manager
      .createQueryBuilder('CarbonLog', 'log')
      .where('log.org_id = :orgId', { orgId })
      .andWhere('log.year = :year', { year: baseYear })
      .select('SUM(log.total_emission)', 'total')
      .getRawOne();
    const baseYearEmissions = Number(baseYearLog?.total || 0);

    // Calculate baseline estimate if logs are empty
    let finalBaseYearEmissions = baseYearEmissions;
    let finalCurrentYearEmissions = currentYearEmissions;
    const estimatedYearlyEmission =
      (Number(org.number_of_employees) || 10) * 1.8 +
      (Number(org.total_floor_area) || 100) * 0.08;

    if (finalBaseYearEmissions <= 0) {
      finalBaseYearEmissions = estimatedYearlyEmission;
    }
    if (finalCurrentYearEmissions <= 0) {
      const targetPercent = Number(org.target_reduction_percent) || 10;
      finalCurrentYearEmissions =
        finalBaseYearEmissions * (1 - targetPercent / 2 / 100);
    }

    let totalCarbonReduction = 0;
    if (finalBaseYearEmissions > 0 && finalCurrentYearEmissions > 0) {
      totalCarbonReduction = finalBaseYearEmissions - finalCurrentYearEmissions;
      if (totalCarbonReduction < 0) totalCarbonReduction = 0;
    }

    const assessmentsCompleted = await this.orgRepository.manager
      .getRepository('Assessment')
      .count({
        where: { org_id: orgId, status: 'APPROVED' },
      });

    return {
      organization: {
        id: org.id,
        name: org.name,
      },
      year: currentYear,
      total_carbon_reduction: Math.round(totalCarbonReduction * 100) / 100,
      assessments_completed: assessmentsCompleted,
      active_employees: org.users ? org.users.length : 0,
      status: 'Preliminary',
    };
  }
}

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

  async createUnit(orgId: number, unitData: Partial<OrganizationUnit>): Promise<OrganizationUnit> {
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

  async updateUnit(unitId: number, updateData: Partial<OrganizationUnit>): Promise<OrganizationUnit | null> {
    await this.orgUnitRepository.update(unitId, updateData);
    return this.orgUnitRepository.findOne({ where: { id: unitId }, relations: ['parent_unit'] });
  }

  async removeUnit(unitId: number): Promise<void> {
    await this.orgUnitRepository.delete(unitId);
  }
}

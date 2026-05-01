import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async create(orgData: Partial<Organization>): Promise<Organization> {
    const org = this.orgRepository.create(orgData);
    return this.orgRepository.save(org);
  }

  async findOne(id: number): Promise<Organization | null> {
    return this.orgRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find();
  }

  async update(id: number, updateData: Partial<Organization>): Promise<Organization | null> {
    await this.orgRepository.update(id, updateData);
    return this.findOne(id);
  }
}

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

  async create(orgData: any): Promise<Organization> {
    const org = this.orgRepository.create(orgData);
    return this.orgRepository.save(org);
  }

  async findOne(id: number): Promise<Organization | null> {
    return this.orgRepository.findOne({ 
      where: { id },
      relations: ['users']
    });
  }

  async findAll(): Promise<any[]> {
    const orgs = await this.orgRepository.createQueryBuilder('org')
      .leftJoinAndSelect('org.users', 'users')
      .orderBy('org.name', 'ASC')
      .getMany();

    return orgs.map(org => ({
      ...org,
      userCount: org.users ? org.users.length : 0
    }));
  }

  async update(id: number, updateData: any): Promise<Organization | null> {
    await this.orgRepository.update(id, updateData);
    return this.findOne(id);
  }
}

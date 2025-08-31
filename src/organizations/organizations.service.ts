import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';

@Injectable()
export class OrganizationsService {
  constructor(@InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>) {}

  async create(createOrgDto: Partial<Organization>): Promise<Organization> {
    const createdOrg = new this.orgModel(createOrgDto);
    return createdOrg.save();
  }

  async findAll(): Promise<Organization[]> {
    return this.orgModel.find().exec();
  }

  async findOne(id: string): Promise<Organization | null> {
    return this.orgModel.findById(id).exec();
  }

  async update(id: string, updateOrgDto: Partial<Organization>): Promise<Organization | null> {
    return this.orgModel.findByIdAndUpdate(id, updateOrgDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Organization | null> {
    return this.orgModel.findByIdAndDelete(id).exec();
  }
}

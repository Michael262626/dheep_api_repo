import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return await createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async updateByPhone(phone: string, updateUserDto: Partial<User>): Promise<User | null> {
    return await this.userModel.findOneAndUpdate({ phone }, updateUserDto, { new: true }).exec();
  }

  async remove(id: string): Promise<User | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return await this.userModel.findOne({ phone }).exec();
  }
}

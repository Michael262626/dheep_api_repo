import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true, unique: true })
  adminEmail: string;

  @Prop({ required: true })
  adminPasswordHash: string;

  @Prop({ required: true })
  contactFirstName: string;

  @Prop({ required: true })
  contactLastName: string;

  @Prop({ required: true })
  contactMobile: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  logo?: string;

  @Prop({ default: false })
  mfaEnabled: boolean;

  @Prop()
  mfaSecret?: string;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
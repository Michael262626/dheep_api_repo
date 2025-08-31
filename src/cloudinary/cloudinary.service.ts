import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File | Buffer, folder = 'uploads'): Promise<UploadApiResponse> {
    if (file instanceof Buffer) {
      const uploadStream = cloudinary.uploader.upload_stream({ folder });
      return new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve).on('error', reject);
        uploadStream.end(file);
      });
    } else {
      return cloudinary.uploader.upload((file as Express.Multer.File).path, { folder });
    }
  }

  async uploadBase64(base64: string, folder = 'uploads'): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(base64, { folder });
  }

  async deleteFile(publicId: string): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return cloudinary.uploader.destroy(publicId);
  }
}
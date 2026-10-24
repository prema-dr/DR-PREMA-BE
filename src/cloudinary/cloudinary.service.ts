import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export type UploadedImage = { url: string; publicId: string };

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload(file: Express.Multer.File, folder: string): Promise<UploadedImage> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `dr-prema/${folder}`, resource_type: 'image', overwrite: false },
          (error, result) => {
            if (error || !result) {
              this.logger.error(`Cloudinary upload failed: ${error?.message}`);
              return reject(new InternalServerErrorException('Image upload failed'));
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
          },
        )
        .end(file.buffer);
    });
  }

  // Best effort: a failed cleanup must never fail the admin's request.
  async remove(publicId: string | null | undefined): Promise<void> {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      this.logger.warn(`Could not delete Cloudinary asset ${publicId}: ${(error as Error).message}`);
    }
  }
}

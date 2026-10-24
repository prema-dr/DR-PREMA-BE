import {
  applyDecorators,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Single-image multipart upload kept in memory and streamed to Cloudinary by the service layer.
export const ImageUpload = (field = 'image') =>
  applyDecorators(
    UseInterceptors(
      FileInterceptor(field, {
        storage: memoryStorage(),
        limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
        fileFilter: (_req, file, cb) => {
          if (!ALLOWED.has(file.mimetype)) {
            return cb(
              new BadRequestException(
                'Only JPEG, PNG or WebP images are allowed',
              ),
              false,
            );
          }
          cb(null, true);
        },
      }),
    ),
  );

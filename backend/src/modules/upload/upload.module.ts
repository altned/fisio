import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
}

@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    cb(null, uploadDir);
                },
                filename: (_req, file, cb) => {
                    // Generate unique filename
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `promo-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                // Only allow image files
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    cb(new Error('Only image files are allowed!'), false);
                } else {
                    cb(null, true);
                }
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB max
            },
        }),
    ],
    controllers: [UploadController],
})
export class UploadModule { }

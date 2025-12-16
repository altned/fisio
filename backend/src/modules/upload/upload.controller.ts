import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard, Roles, RolesGuard } from '../../common/auth';

@Controller('upload')
export class UploadController {
    /**
     * Upload promo banner image (Admin only)
     * Returns the URL to access the uploaded image
     */
    @Post('promo')
    @UseGuards(JwtGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('image'))
    uploadPromo(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        // Return the relative path - clients will prepend their API base URL
        // This allows mobile to use the correct IP address
        const relativePath = `/uploads/${file.filename}`;

        return {
            success: true,
            url: relativePath,
            filename: file.filename,
            size: file.size,
        };
    }
}

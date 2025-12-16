import { Controller, Get } from '@nestjs/common';
import { PackageService } from './package.service';

@Controller('packages')
export class PackageController {
    constructor(private readonly packageService: PackageService) { }

    @Get()
    list() {
        return this.packageService.list();
    }

    /**
     * Get promo packages for carousel on patient dashboard
     */
    @Get('promos')
    promos() {
        return this.packageService.promos();
    }
}

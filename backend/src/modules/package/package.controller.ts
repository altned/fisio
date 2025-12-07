import { Controller, Get } from '@nestjs/common';
import { PackageService } from './package.service';

@Controller('packages')
export class PackageController {
    constructor(private readonly packageService: PackageService) { }

    @Get()
    list() {
        return this.packageService.list();
    }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/packages')
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    @Get()
    findAll() {
        return this.packagesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packagesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreatePackageDto) {
        return this.packagesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
        return this.packagesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.packagesService.remove(id);
    }

    @Patch(':id/toggle-active')
    toggleActive(@Param('id') id: string) {
        return this.packagesService.toggleActive(id);
    }
}

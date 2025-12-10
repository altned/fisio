import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TherapistsService } from './therapists.service';
import { CreateTherapistDto } from './dto/create-therapist.dto';
import { UpdateTherapistDto } from './dto/update-therapist.dto';
import { Roles, RolesGuard, JwtGuard } from '../../common/auth';

@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/therapists')
export class TherapistsController {
    constructor(private readonly therapistsService: TherapistsService) { }

    @Get()
    findAll() {
        return this.therapistsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.therapistsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateTherapistDto) {
        return this.therapistsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateTherapistDto) {
        return this.therapistsService.update(id, dto);
    }

    @Patch(':id/status')
    toggleStatus(@Param('id') id: string) {
        return this.therapistsService.toggleStatus(id);
    }

    @Patch(':id/reset-password')
    resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
        return this.therapistsService.resetPassword(id, body.newPassword);
    }
}

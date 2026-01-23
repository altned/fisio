import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtGuard } from '../../common/auth/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // SECURITY: Limit login attempts to prevent brute force
    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // SECURITY: Limit registration to prevent spam
    @Post('register')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    // SECURITY: Limit Google auth attempts
    @Post('google')
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
    loginWithGoogle(@Body() dto: GoogleAuthDto) {
        return this.authService.loginWithGoogle(dto.idToken);
    }

    // SECURITY: Limit forgot password requests
    @Post('forgot-password')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    // SECURITY: Limit reset password attempts
    @Post('reset-password')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
    }

    // Refresh access token
    @Post('refresh')
    @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 attempts per minute
    refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refreshToken);
    }

    // Logout - invalidate refresh token
    @Post('logout')
    @UseGuards(JwtGuard)
    logout(@Request() req: any) {
        return this.authService.logout(req.user.id);
    }
}

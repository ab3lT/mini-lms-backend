import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // The only unauthenticated endpoint in the whole API - there is no
  // POST /auth/register or similar. Admins create every other account.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User authenticated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}

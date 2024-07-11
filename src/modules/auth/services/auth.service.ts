import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/services/user.service';

@Dependencies(UserService, JwtService)
@Injectable()
export class AuthService {
    private readonly usersService: UserService;
    private readonly jwtService: JwtService;
  constructor(usersService: UserService, jwtService: JwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(email: string, pass: string) {
    const user = await this.usersService.findOne(email);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { AdminLoginInput } from '../dto/admin-login.input';
import { AdminLoginPayload } from '../dto/admin-login.payload';
import { ValidateTokenInput } from '../dto/validate-token.input';
import { TokenValidationPayload } from '../dto/token-validation.payload';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AdminLoginPayload)
  adminLogin(@Args('input') input: AdminLoginInput): Promise<AdminLoginPayload> {
    return this.authService.adminLogin(input);
  }

  @Mutation(() => TokenValidationPayload)
  validateToken(@Args('input') input: ValidateTokenInput): Promise<TokenValidationPayload> {
    return this.authService.validateToken(input.token);
  }
}

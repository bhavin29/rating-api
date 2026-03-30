import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../services/auth.service';
import { ValidateTokenInput } from '../dto/validate-token.input';
import { TokenValidationPayload } from '../dto/token-validation.payload';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => TokenValidationPayload)
  validateToken(@Args('input') input: ValidateTokenInput): Promise<TokenValidationPayload> {
    return this.authService.validateToken(input.token);
  }
}

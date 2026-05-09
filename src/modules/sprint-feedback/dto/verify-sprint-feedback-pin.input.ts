import { IsString, Length } from 'class-validator';
import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

export class VerifySprintFeedbackPinInput {
  @IsDbUuid()
  userId: string;

  @IsString()
  @Length(6, 6)
  pin: string;
}

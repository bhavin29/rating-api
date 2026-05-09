import { IsDbUuid } from '../../../common/validators/is-db-uuid.decorator';

export class SendSprintFeedbackEmailInput {
  @IsDbUuid()
  userId: string;
}

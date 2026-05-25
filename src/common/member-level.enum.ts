import { registerEnumType } from '@nestjs/graphql';

export enum MemberLevel {
  L1 = '1',
  L2 = '2',
  L3 = '3',
  L1_PLUS = '1+',
  L2_PLUS = '2+',
  L3_PLUS = '3+',
}

registerEnumType(MemberLevel, { name: 'MemberLevel' });

export enum EmailType {
  INVITE = 'INVITE',
  REMINDER = 'REMINDER',
}

export enum EmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum TokenType {
  MAGIC_LINK = 'MAGIC_LINK',
}

export enum AuditAction {
  CREATE_PROJECT = 'CREATE_PROJECT',
  CREATE_SPRINT = 'CREATE_SPRINT',
  SUBMIT_RATING = 'SUBMIT_RATING',
}

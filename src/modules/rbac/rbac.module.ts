import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  providers: [RbacGuard, Reflector],
  exports: [RbacGuard],
})
export class RbacModule {}

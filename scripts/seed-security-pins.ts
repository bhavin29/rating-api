import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/services/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const usersService = app.get(UsersService);
  const seeded = await usersService.seedSecurityPinsForExistingUsers();

  console.log(`Seeded ${seeded.length} users with security PINs.`);
  seeded.forEach(({ userId, pin }) => {
    console.log(`${userId}\t${pin}`);
  });

  await app.close();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

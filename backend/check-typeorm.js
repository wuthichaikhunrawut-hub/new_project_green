const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { UsersService } = require('./dist/users/users.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log('Fetching ASSESSOR users using UsersService...');
    const users = await usersService.findAll('ASSESSOR');
    console.log('Result count:', users.length);
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  } catch (error) {
    console.error('Error during fetch:', error);
  }

  await app.close();
}

bootstrap();

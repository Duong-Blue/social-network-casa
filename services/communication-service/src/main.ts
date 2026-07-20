import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    // Hiển thị log framework (InstanceLoader, RoutesResolver, WebSocketsController)
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn'], // Hiển thị log, error, warn nhưng không hiển thị debug/verbose
    });

    app.enableCors({
      origin: '*',
      credentials: true,
    });

    await app.listen(3000);
  } catch (error) {
    console.error('[Server] ✗ Failed to start server:', error);
    if (error instanceof Error) {
      console.error('[Server] Error message:', error.message);
      console.error('[Server] Error stack:', error.stack);
    }
    process.exit(1);
  }
}
bootstrap();

// cypod-telemetry
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import {printBanner} from './banner-printer';

import { NestLogger } from './shared/infrastructure/logger/nest-logger';
import { GlobalErrorFilter } from './shared/infrastructure/filters/global-error.filter';
import { LocalizationService } from './shared/infrastructure/i18n/localization.service';
// note: Prisma exception filters are disabled until the Prisma schema/client is generated
// (deferred). Re-enable these two imports and their registrations below after `prisma generate`.
// import { PrismaKnownExceptionFilter } from './shared/infrastructure/filters/prisma-known-exception.filter';
// import { PrismaUnknownExceptionFilter } from './shared/infrastructure/filters/prisma-unknown-exception.filter';

async function bootstrap() {

    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const frontendUrl = configService.get('FRONTEND_URL');

    app.enableCors({
        origin: frontendUrl,
        credentials: true,
    });
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    app.setGlobalPrefix('api');

    // note: required for OnApplicationShutdown/OnModuleDestroy hooks (e.g. RedisConnection.quit())
    // to actually run on SIGINT/SIGTERM — without it, connection cleanup never fires.
    app.enableShutdownHooks();

    const logger = new NestLogger();
    // note: pull the singleton the modules registered their catalogs into (their onModuleInit has
    // already run by now), so the filter and the modules share one populated LocalizationService.
    const localization = app.get(LocalizationService);

    app.useGlobalFilters(
        new GlobalErrorFilter(logger, localization),
        // note: re-enable once the Prisma client is generated (see disabled imports above)
        // new PrismaUnknownExceptionFilter(logger),
        // new PrismaKnownExceptionFilter(logger),
    );

    const config = new DocumentBuilder()
        .setTitle('Cypod Telemetry Service API')
        .setDescription('Device telemetry ingestion, cached latest-state, and alerts')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.PORT || 3000);

    
    // Show banner AFTER everything is initialized
    const env = process.env.NODE_ENV?.trim() || 'development';
    const envFile = env === 'production' ? '.env.production' : '.env';
    const timestamp = new Date().toLocaleString();
    const port = Number(process.env.PORT) || 3000;
    printBanner(env, envFile, timestamp, port);
}
bootstrap();

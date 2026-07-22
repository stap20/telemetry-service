// cypod-telemetry
import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { ILogger } from '../../domain/contracts/logger.interface';
import { NestLogger } from '../logger/nest-logger';
import { CronJobConfig } from './cron-job-config.interface';
import { IScheduleRegistry } from './schedule-registry.interface';

@Injectable()
export abstract class CronJobBase {
    protected readonly logger: ILogger;

    constructor(protected readonly scheduleRegistry: IScheduleRegistry) {
        this.logger = new NestLogger();
        this.registerCronJob();
    }

    protected abstract getConfig(): CronJobConfig;
    protected abstract execute(): Promise<void>;

    private registerCronJob(): void {
        const config = this.getConfig();
        const jobName = config.name;
        const cronExpression = config.cronExpression;

        const cronJob = new CronJob(cronExpression, async () => {
            await this.handleCron();
        });

        this.scheduleRegistry.addCronJob(jobName, cronJob);
        this.logger.info(
            `Registered cron job: ${jobName} with expression: ${cronExpression}`,
        );

        this.startJob();
    }

    async handleCron(): Promise<void> {
        const config = this.getConfig();

        if (!config.enabled) {
            this.logger.debug(`${config.name} job is disabled`);
            return;
        }

        const startTime = Date.now();
        this.logger.info(`Starting ${config.name} job`);

        try {
            await this.execute();

            const duration = Date.now() - startTime;
            this.logger.info(`Completed ${config.name} job in ${duration}ms`);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(
                `Failed ${config.name} job after ${duration}ms: ${error.message}`,
                error.stack,
            );
        }
    }

    stopJob(): void {
        const config = this.getConfig();
        this.scheduleRegistry.deleteCronJob(config.name);
        this.logger.info(`Stopped cron job: ${config.name}`);
    }

    startJob(): void {
        const config = this.getConfig();
        this.scheduleRegistry.getCronJob(config.name).start();
        this.logger.info(`Started cron job: ${config.name}`);
    }

    async manualExecute(): Promise<void> {
        const config = this.getConfig();
        this.logger.info(`Manual execution of ${config.name}`);
        await this.execute();
    }
}

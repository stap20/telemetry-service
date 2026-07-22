// cypod-telemetry
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { IScheduleRegistry } from './schedule-registry.interface';

@Injectable()
export class NestScheduleRegistry implements IScheduleRegistry {
    private readonly schedulerRegistry: SchedulerRegistry =
        new SchedulerRegistry();

    addCronJob(name: string, job: CronJob): void {
        this.schedulerRegistry.addCronJob(name, job);
    }

    getCronJob(name: string): CronJob {
        return this.schedulerRegistry.getCronJob(name);
    }

    deleteCronJob(name: string): void {
        this.schedulerRegistry.deleteCronJob(name);
    }

    getCronJobs(): Map<string, CronJob> {
        return this.schedulerRegistry.getCronJobs();
    }
}

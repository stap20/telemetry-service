// cypod-telemetry
import { CronJob } from 'cron';

export interface IScheduleRegistry {
    addCronJob(name: string, job: CronJob): void;
    getCronJob(name: string): CronJob;
    deleteCronJob(name: string): void;
    getCronJobs(): Map<string, CronJob>;
}

export const IScheduleRegistry = Symbol('IScheduleRegistry');

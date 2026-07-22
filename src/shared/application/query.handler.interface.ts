// cypod-telemetry
import { IQuery } from './query.interface';

export interface IQueryHandler<TQuery extends IQuery, TResponse> {
    handle(query: TQuery): Promise<TResponse>;
}

// cypod-telemetry
// src/shared/application/paginated-result.ts

// note: lives in shared rather than inside the devices module because pagination is a property of
// how a list is read, not of what is being listed — the next paginated endpoint in any module
// should not reinvent the envelope or, worse, invent a differently-shaped one.
//
// `total` is carried alongside the page because a client cannot build a pager without it: returning
// only the items forces callers to guess whether they are on the last page by checking if the array
// came back short, which breaks the moment a page happens to be exactly full. It costs a COUNT
// query, which is the honest price of telling the caller the truth.
export class PaginatedResult<T> {
    constructor(
        public readonly items: T[],
        public readonly total: number,
        public readonly offset: number,
        public readonly limit: number,
    ) {}
}

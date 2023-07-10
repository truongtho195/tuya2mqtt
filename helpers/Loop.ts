import { filter, from, lastValueFrom, mergeMap, toArray } from "rxjs"

export class Loop {

    static async mapAsync<T, R>(
        items: T[] | IterableIterator<T>,
        mapper: (item: T, index: number) => Promise<R>,
        limit?: number,
        throwError: boolean = false
    ) {
        return await lastValueFrom(
            from(items).pipe(
                mergeMap(async (item, index) => {
                    try { 
                        return await mapper(item, index)
                    } catch (e) {
                        if (throwError) throw e
                    }
                }, limit),
                filter(Boolean),
                toArray()
            ),
            { defaultValue: [] }
        )

    }
}
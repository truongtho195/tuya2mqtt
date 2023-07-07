import { filter, from, lastValueFrom, mergeMap, toArray } from "rxjs"

export class Loop {

    static async mapAsync<T, R>(
        items: T[],
        mapper: (item: T, index: number, arr: T[]) => Promise<R>,
        limit?: number,
        throwError: boolean = false
    ) {
        if (items.length == 0) return []
        return await lastValueFrom(
            from(items).pipe(
                mergeMap(async (item, index) => {
                    try {
                        return await mapper(item, index, items)
                    } catch (e) {
                        if (throwError) throw e
                    }
                }, limit),
                filter(Boolean),
                toArray()
            )
        )

    }
}
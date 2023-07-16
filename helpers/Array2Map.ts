

export const Array2Map = {
    from<T>(items: T[], key: keyof T) {
        return items.reduce((p, c) => {
            p.set(c[key] as string, c)
            return p
        }, new Map<string, T>())
    }
}
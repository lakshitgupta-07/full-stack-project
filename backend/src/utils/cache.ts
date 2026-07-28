import {redis} from '../config/redis.js'

export const getCache = async <T>(key: string): Promise<T | null> => {
    const value = await redis.get(key)

    if(!value) {
        return null
    }
    console.log("Cache hit");
    
    return JSON.parse(value)
}

export const setCache = async(key: string, value: unknown, ttl = 300) => {
    await redis.set(key, JSON.stringify(value), "EX", ttl)
}

export const deleteCache = async(key: string) => {
    await redis.del(key)
}
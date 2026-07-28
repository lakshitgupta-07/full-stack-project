import {redis} from '../config/redis.js'

export const publish = async(channel: string, message: unknown) => {
    console.log("Publishing:", channel);
    
    await redis.publish(
        channel,
        JSON.stringify(message)
    )
}
import { Banner } from "../models/banner.model.js";
import { CreateBannerInput, createBannerSchema } from "../validators/banner.validator.js";
import { ApiError } from "../utils/ApiError.js";
import { getCache, setCache, deleteCache } from "../utils/cache.js";
import mongoose from "mongoose";
import { publish } from "../redis/publisher.redis.js";
import { channels } from "../redis/channels.redis.js";
const CACHED_BANNER_KEY = "banner: active"


export const createBannerService = async (
    data: CreateBannerInput,
    createdBy: mongoose.Types.ObjectId
) => {
    
    const validatedBanner = createBannerSchema.parse(data);

    const banner = await Banner.create({
        ...validatedBanner,
        createdBy,
    });
    await publish(
        channels.BANNER_UPDATED,
        {
            id: banner.bannerId,
            title: banner.title,
            description: banner.description,
            backgroundColor: banner.backgroundColor,
            textColor: banner.textColor
        }
    );

    return banner
};

export const getBannerService = async() => {
    
    const cachedBanner = await getCache(CACHED_BANNER_KEY)
    if(cachedBanner) {
        return cachedBanner
    }
    console.log("Cache miss");        

    const banner = await Banner.findOne({
        isActive: true,
    }).sort({createdAt: -1})

    if(!banner) {
        throw new ApiError(404, "No banner found")
    }
    await setCache(CACHED_BANNER_KEY, banner, 300)
    return banner
};

export const updateBannerService = async(
    bannerId: string,
    data: CreateBannerInput
) => {
    const banner = await Banner.findByIdAndUpdate(
        bannerId,
        data,
        {
            new: true
        }
    )
    if(!banner) {
        throw new ApiError(404, "No banner found")
    }
    await deleteCache(CACHED_BANNER_KEY)
    await publish(
        channels.BANNER_UPDATED,
        {
            id: banner.bannerId,
            title: banner.title,
            description: banner.description,
            backgroundColor: banner.backgroundColor,
            textColor: banner.textColor
        }
    )
    return banner
};

export const deleteBannerService = async(
    bannerId: string
): Promise<boolean> => {
    const banner = await Banner.findById(bannerId)
    if(banner) {
        await Banner.deleteOne(banner)
        await deleteCache("banner:active")
        return true
    }
    return false;
};
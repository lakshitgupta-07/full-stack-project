import { User } from "../../models/user.model.js";
import crypto from "crypto"

export const seedAiUser = async() => {
    const existing = await User.findOne({ isAI: true })
    if(existing) {
        return existing
    }

    const aiUser = await User.create({
        username: "travel-ai",
        email: "travel-ai@system.local",
        password: crypto.randomUUID(),
        isAI: true,
        avatar: {
            url: "/avatars/travel-ai.png",
            publicId: ""
        }
    });
    return aiUser
}
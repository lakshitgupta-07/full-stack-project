import { User } from "../../models/user.model.js";
import crypto from "crypto"

export const seedAiUser = async() => {
    let existing = await User.findOne({ isAI: true })
    if(existing) {
        if (existing.avatar?.url === "/avatars/travel-ai.png") {
            existing.avatar.url = "/assets/travel-ai.png";
            await existing.save();
        }
        return existing
    }

    const aiUser = await User.create({
        username: "travel-ai",
        email: "travel-ai@system.local",
        password: crypto.randomUUID(),
        isAI: true,
        avatar: {
            url: "/assets/travel-ai.png",
            publicId: ""
        }
    });
    return aiUser
}
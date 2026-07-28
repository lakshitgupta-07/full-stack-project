import { User } from "../models/user.model.js";
export const generateUsername = async(email: string, preferredName?: string) => {
    const source = preferredName || email.split("@")[0];
    const baseUsername = source.toLowerCase().replace(/[^a-z0-9]/g, "");
    let username = baseUsername
    let count = 1
    while(await User.exists({username})) {
        username = `${baseUsername}${count}`;
        count++;
    }
    return username
}
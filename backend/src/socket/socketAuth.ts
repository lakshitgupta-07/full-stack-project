import type { Socket } from "socket.io";
import type { ExtendedError } from "socket.io";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { AuthenticatedSocket } from "../types/authenticated-socket.js";
export const socketAuth = async(
    socket: Socket,
    next: (err?: ExtendedError) => void
) => {
    try {
        const token = socket.handshake.auth.token;
        if(!token) {
            return next(new Error("Authentication required"))
        }
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as {
            id?: string;
            _id?: string;
        };
        const userId = decoded.id || decoded._id;
        const user = await User.findById(userId)
        if(!user) {
            return next(new Error("User not found"))
        }
        (socket as AuthenticatedSocket).user = user
        next()
    } catch (error) {
        next(new Error("Invalid token"))
    }
}
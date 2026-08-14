import { UserDocument } from "../models/user.model.js";
import { Socket } from "socket.io";

export interface AuthenticatedSocket extends Socket {
    user: UserDocument,
    activeThreadId?: string
}
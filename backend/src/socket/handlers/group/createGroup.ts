import { Thread } from "../../../models/thread.model.js";
import { User } from "../../../models/user.model.js";
import { getIO } from "../../socket.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";

export const createGroup = async(
    socket: AuthenticatedSocket,
    payload: {
        groupName: string,
        participants: string[]
    }
) => {
    const {groupName, participants} = payload

    if(!groupName.trim()) {
        throw new Error("Group name is Required")
    }
    if(participants.length < 2) {
        throw new Error("Group must contain at least 3 members")
    }

    const user = await User.find({
        _id: {
            $in: participants
        }
    });
    if(user.length !== participants.length) {
        throw new Error("Some users does'nt exist")
    }
    const allParticipants = [
        socket.user._id,
        ...participants
    ];

    const uniqueParticipants = [
        ...new Set(allParticipants.map(id => id.toString()))
    ]
    const thread = await Thread.create({
        isGroup: true,
        groupName,
        participants: uniqueParticipants,
        admins: [socket.user._id],
        createdBy: socket.user._id,
        status: "active"
    });
    const populatedThread = await Thread.findById(thread._id)
    .populate("participants", "username avatar")
    .populate("createdBy", "username avatar")
    .populate("admins", "username avatar");

    uniqueParticipants.forEach(userId => {
        getIO().to(userId).emit(
            "group-created",
            populatedThread
        );
    });
    return populatedThread
}
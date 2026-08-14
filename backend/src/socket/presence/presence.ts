const onlineUser = new Map<string, Set<string>>();
const activeThreads = new Map<string, string>();


export const addUser = (
    userId: string,
    socketId: string
) => {
    if(!onlineUser.has(userId)) {
        onlineUser.set(userId, new Set())
    }
    onlineUser.get(userId)!.add(socketId)
};

export const removeUser = (
    userId: string,
    socketId: string
) => {
    const sockets = onlineUser.get(userId)
    if(!sockets) {
        return ;
    }
    sockets.delete(socketId)
    if(sockets.size === 0) {
        onlineUser.delete(userId);
        activeThreads.delete(userId)
    }
}

export const isOnline = (
    userId: string
) => {
    return onlineUser.has(userId)
}

export const getSocketIds = (
    userId: string
) => {
    return [...(onlineUser.get(userId) ?? [])]
}

export const getOnlineUsers = () => {
    return [...onlineUser.keys()]
}

export const setActiveThread = (
    userId: string,
    threadId: string
) => {
    activeThreads.set(userId, threadId)
}

export const clearActiveThread = (
    userId: string,
) => {
    activeThreads.delete(userId)
}

export const getActiveThread = (
    userId: string
) => {
    return activeThreads.get(userId)
}
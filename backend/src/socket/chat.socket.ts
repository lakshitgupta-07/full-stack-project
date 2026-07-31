import type { Socket } from "socket.io";

export function registerChatEvents(socket: Socket) {
    socket.on("Hello", (data) => {
        console.log(data);
    })
}
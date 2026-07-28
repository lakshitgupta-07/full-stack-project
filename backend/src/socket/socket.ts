import { Server } from "socket.io"
import type { Server as HttpServer } from "http"

let io: Server;

export const initializeSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        },
    });

    io.on("connection", (socket) => {
        console.log(`Socket Connected: ${socket.id}`);
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

export const getIO = () => {
    if(!io) {
        throw new Error("Socket.ID not intialized")
    }
    return io;
}
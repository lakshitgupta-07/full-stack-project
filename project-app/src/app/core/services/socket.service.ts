import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { environment } from "../../../environment/envirenment";

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket!: Socket;

    connect(): void {
        if(this.socket?.connected) {
            return ;
        }

        this.socket = io(environment.socketUrl,{
            withCredentials: true
        })

        this.socket.on('connect', () => {
            console.log("Socket connected: ", this.socket.id);
        })

        this.socket.on('disconnect', () => {
            console.log("Socket disconnected: ", this.socket.id);
        })
    };
    listen<T>(event:string, callback: (data: T) => void) : void {
        this.socket.on(event, callback)
    }
    emit(event: string, data: unknown): void {
        this.socket.emit(event, data)
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
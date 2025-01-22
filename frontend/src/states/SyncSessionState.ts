import { create } from "zustand";
import { EventEmitter } from "events";
import { io } from "socket.io-client";
import { getBackendURL, isDev } from "../backendURL";

export interface SyncSessionState {
    socket: any;
    isHost: boolean;
    room: string | null;

    connect: (room?: string) => Promise<true | SocketError>;
    disconnect: () => void;
}

export interface SocketError {
    type: string;
    message: string;
}

export const SessionStateEmitter = new EventEmitter();

export const useSyncSessionState = create<SyncSessionState>((set, get) => ({
    socket: null,
    isHost: false,
    room: null,

    connect: async (room) => {
        return new Promise<true | SocketError>((resolve) => {
            const socket = isDev ? io(getBackendURL(), {
                auth: {
                    token: localStorage.getItem("accAccessToken")
                },
                query: {
                    room: room || "new"
                },
                autoConnect: false
            }) : io({
                auth: {
                    token: localStorage.getItem("accAccessToken")
                },
                query: {
                    room: room || "new"
                },
                autoConnect: false
            });

            console.log("Connecting to server");

            socket.on("connect", async () => {
                console.log("Connected to server");
            });

            (new Promise<true | SocketError>((resolve) => {
                let resolved = false;

                socket.once("ready", (data) => {
                    console.log("Ready", data);
                    set({ isHost: data.host, room: data.room });
                    resolved = true;
                    resolve(true);
                });

                socket.once("conn-error", (data) => {
                    console.log("Error", data);
                    resolved = true;
                    resolve(data);
                });

                setTimeout(() => {
                    if (!resolved) resolve({
                        type: "timeout",
                        message: "Connection timed out"
                    });
                }, 5000);
            }))
                .then((result) => {
                    if (result !== true) {
                        socket.disconnect();
                        return resolve(result);
                    } else {
                        set({ socket });
                        resolve(true);
                    }

                })

            socket.connect();

            socket.on("disconnect", () => {
                console.log("Disconnected from server");
                set({ socket: null, isHost: false, room: null });
                SessionStateEmitter.emit("disconnect");
            })
        });
    },
    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null, isHost: false, room: null });
    }
}));
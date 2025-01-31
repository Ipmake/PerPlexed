import { create } from "zustand";
import { EventEmitter } from "events";
import { io, Socket } from "socket.io-client";
import { getBackendURL, isDev } from "../backendURL";
import { NavigateFunction } from "react-router-dom";
import { useToast } from "../components/ToastManager";

export interface SyncSessionState {
    socket: Socket | null;
    isHost: boolean;
    room: string | null;

    connect: (room?: string, navigate?: NavigateFunction) => Promise<true | PerPlexed.Sync.SocketError>;
    disconnect: () => void;
}

export const SessionStateEmitter = new EventEmitter();

export const useSyncSessionState = create<SyncSessionState>((set, get) => ({
    socket: null,
    isHost: false,
    room: null,

    connect: async (room, navigate) => {
        return new Promise<true | PerPlexed.Sync.SocketError>((resolve) => {
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

            (new Promise<true | PerPlexed.Sync.SocketError>((resolve) => {
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
                        SocketManager(navigate);
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

function SocketManager(navigate: NavigateFunction | undefined) {
    const { socket, isHost } = useSyncSessionState.getState();
    if (socket === null) return;


    if (isHost) 
    {
        socket.on("HOST_SYNC_GET_PLAYBACK", () => {
            const { playBackState } = useSessionPlayBackCache.getState();
            console.log("Sending playback state", playBackState);
            socket.emit("RES_SYNC_GET_PLAYBACK", playBackState);
        });
    }
    else 
    {
        socket.on("RES_SYNC_SET_PLAYBACK", (user: PerPlexed.Sync.Member, data: PerPlexed.Sync.PlayBackState) => {
            console.log("Playback state received", data);
            navigate?.(`/watch/${data.key}?t=${data.time}`);
            useToast.getState().addToast(user, "PlaySet", "Started Playback", 5000);
        });

        socket.on("RES_SYNC_RESYNC_PLAYBACK", (user: PerPlexed.Sync.Member, data: PerPlexed.Sync.PlayBackState) => {
            console.log("Playback resync received", data);
            SessionStateEmitter.emit("PLAYBACK_RESYNC", data);
        })

        socket.on("RES_SYNC_PLAYBACK_END", (user: PerPlexed.Sync.Member) => {
            SessionStateEmitter.emit("PLAYBACK_END");
        })
    }

    socket.on("EVNT_SYNC_PAUSE", (user: PerPlexed.Sync.Member) => {
        useToast.getState().addToast(user, "Pause", "Paused Playback", 5000);
        SessionStateEmitter.emit("PLAYBACK_PAUSE");
    })

    socket.on("EVNT_SYNC_RESUME", (user: PerPlexed.Sync.Member) => {
        useToast.getState().addToast(user, "Play", "Resumed Playback", 5000);
        SessionStateEmitter.emit("PLAYBACK_RESUME");
    })

    socket.on("EVNT_SYNC_SEEK", (user: PerPlexed.Sync.Member, time: number) => {
        SessionStateEmitter.emit("PLAYBACK_SEEK", time);
    })

    socket.on("EVNT_USER_JOIN", (user: PerPlexed.Sync.Member) => {
        useToast.getState().addToast(user, "UserAdd", "Joined the session", 5000);
    });

    socket.on("EVNT_USER_LEAVE", (user: PerPlexed.Sync.Member) => {
        useToast.getState().addToast(user, "UserRemove", "Left the session", 5000);
    });


}

export interface SessionPlayBackCache {
    playBackState: PerPlexed.Sync.PlayBackState | null;

    update: (data: PerPlexed.Sync.PlayBackState) => void;
}

export const useSessionPlayBackCache = create<SessionPlayBackCache>((set, get) => ({
    playBackState: null,

    update: (data) => {
        set({ playBackState: data });
    }
}));
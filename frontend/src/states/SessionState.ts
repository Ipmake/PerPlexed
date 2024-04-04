import { create } from "zustand";
import { makeid } from "../plex/QuickFunctions";

type SessionState = {
    sessionID: string;
    XPlexSessionID: string;
    generateSessionID: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
    sessionID: makeid(24),
    XPlexSessionID: makeid(24),
    generateSessionID: () => {
        set({ sessionID: makeid(24), XPlexSessionID: makeid(24) });
    }
}));
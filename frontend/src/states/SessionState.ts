import { create } from "zustand";
import { makeid } from "../plex/QuickFunctions";

type SessionState = {
    sessionID: string;
    generateSessionID: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
    sessionID: makeid(16),
    generateSessionID: () => {
        set({ sessionID: makeid(16) });
    }
}));
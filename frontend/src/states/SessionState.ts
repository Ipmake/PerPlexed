import { create } from "zustand";
import { authedGet, makeid } from "../plex/QuickFunctions";

type SessionState = {
    sessionID: string;
    XPlexSessionID: string;
    PlexServer: Plex.ServerPreferences | null;
    generateSessionID: () => void;
    fetchPlexServer: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
    sessionID: makeid(24),
    XPlexSessionID: makeid(24),
    PlexServer: null,
    generateSessionID: () => {
        set({ sessionID: makeid(24), XPlexSessionID: makeid(24) });
    },
    fetchPlexServer: async () => {
        try {
            const res = await authedGet("/");
            if (!res) return;

            set({ PlexServer: res.MediaContainer ?? null });
        } catch (err) {
            console.log(err);
        }
    },
}));
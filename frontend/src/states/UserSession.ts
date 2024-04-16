import { create } from "zustand";
import { getLoggedInUser } from "../plex";

interface UserSessionState {
    user: Plex.UserData | null;
    loadUser: () => void;
}

export const useUserSessionStore = create<UserSessionState>((
    set,
    get
) => ({
    user: null,
    loadUser: async () => {
        const res = await getLoggedInUser();
        if(!res) return set({ user: null });
        set({ 
            user: res
         });
    }
}));

useUserSessionStore.getState().loadUser();
import { create } from "zustand";
import { PlexTv } from "../plex/plextv";

interface WatchListCacheState {
    watchListCache: Plex.Metadata[];
    setWatchListCache: (watchListCache: Plex.Metadata[]) => void;
    addItem: (item: Plex.Metadata) => void;
    removeItem: (item: string) => void;
    loadWatchListCache: () => void;
    isOnWatchList: (item: string) => boolean;
}

export const useWatchListCache = create<WatchListCacheState>((set) => ({
    watchListCache: [],
    setWatchListCache: (watchListCache) => set({ watchListCache }),
    addItem: async (item) => {
        if (useWatchListCache.getState().watchListCache.includes(item)) return;
        await PlexTv.addToWatchlist(item.guid.split("/")[3]);
        set((state) => ({ watchListCache: [item, ...state.watchListCache] }))
    },
    removeItem: async (item) => {
        if (!useWatchListCache.getState().isOnWatchList(item)) return;
        await PlexTv.removeFromWatchlist(item.split("/")[3]);
        set((state) => ({ watchListCache: state.watchListCache.filter((i) => i.guid !== item) }));
    },
    loadWatchListCache: async () => {
        const watchList = await PlexTv.getWatchlist();
        set({ watchListCache: watchList });
    },
    isOnWatchList: (item): boolean => useWatchListCache.getState().watchListCache.find((i) => i.guid === item) !== undefined,
}));
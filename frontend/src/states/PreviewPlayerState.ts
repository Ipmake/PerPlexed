import { create } from "zustand";

interface PreviewPlayerState {
    MetaScreenPlayerMuted: boolean;
    setMetaScreenPlayerMuted: (value: boolean) => void;
}

export const usePreviewPlayer = create<PreviewPlayerState>((set) => ({
    MetaScreenPlayerMuted: true,
    setMetaScreenPlayerMuted: (value) => set({ MetaScreenPlayerMuted: value }),
}));
import axios from "axios";
import { PerPlexed } from "../types";

export async function CheckPlexUser(token: string): Promise<PerPlexed.PlexTV.User | null> {
    const data = await axios.get("https://plex.tv/api/v2/user", {
        headers: {
            "X-Plex-Token": token,
        },
    }).then(res => res.data as PerPlexed.PlexTV.User).catch(() => null);

    if (!data) return null;

    return data;
}
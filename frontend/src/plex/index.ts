import axios from "axios";
import { authedGet, authedPost, authedPut, getIncludeProps, getXPlexProps, queryBuilder } from "./QuickFunctions";
import './plex.d.ts'

export async function getAllLibraries(): Promise<Plex.LibarySection[]> {
    const res = await authedGet(`/library/sections`);
    return res.MediaContainer.Directory;
}

export async function getLibrary(key: string): Promise<Plex.MediaContainer> {
    const res = await authedGet(`/library/sections/${key}?${queryBuilder({
        ...getIncludeProps(),
    })}`);
    return res.MediaContainer;
}

/**
 * @deprecated This function is deprecated. Use `getLibraryDir` instead.
 */
export async function getLibraryMedia(path: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`/library${path}`);
    return res.MediaContainer.Metadata;
}

/**
 * Fetches the items from the library directory.
 *
 * @param {string} key - The uri to identify the library directory. e.g. /library/sections/1/all
 * @param {Object.<string, any>} props - Additional properties to include in the query.
 * @returns {Promise<Plex.Metadata[]>} - A promise that resolves to an array of metadata items.
 */
export async function getLibraryDir(key: string, props?: { [key: string]: any }): Promise<Plex.MediaContainer> {
    const res = await authedGet(`${key}?${queryBuilder({
        ...props,
        ...getIncludeProps(),
    })}`);
    return res.MediaContainer;
}

export async function getLibrarySecondary(key: string, directory: string): Promise<Plex.Directory[]> {
    const res = await authedGet(`/library/sections/${key}/${directory}`);
    return res.MediaContainer.Directory;
}

export async function getLibraryMeta(id: string): Promise<Plex.Metadata> {
    if(!id) return {} as Plex.Metadata;
    const res = await authedGet(`/library/metadata/${id}?${queryBuilder({
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata[0];
}

export async function getLibraryMetaChildren(id: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`/library/metadata/${id}/children?${queryBuilder({
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;

}

export async function getSimilar(id: string): Promise<Plex.Metadata[]> {
    if (!id) return [];
    const res = await authedGet(`/library/metadata/${id}/similar?${queryBuilder({
        limit: 10,
        excludeFields: "summary",
        includeMarkerCounts: 1,
        includeRelated: 1,
        includeExternalMedia: 1,
        async: 1,
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;
}

export async function getUniversalDecision(id: string, limitation: {
    autoAdjustQuality?: boolean,
    maxVideoBitrate?: number,
}): Promise<void> {
    await authedGet(`/video/:/transcode/universal/decision?${queryBuilder({
        ...getStreamProps(id, limitation),
    })}`);
    return;
}

export async function sendUniversalPing() {
    await authedGet(`/video/:/transcode/universal/ping?${queryBuilder({
        ...getXPlexProps()
    })}`);
    return;
}

export function getStreamProps(id: string, limitation: {
    autoAdjustQuality?: boolean,
    maxVideoBitrate?: number,
}) {
    return {
        path: "/library/metadata/" + id,
        protocol: "dash",
        fastSeek: 1,
        directPlay: 0,
        directStream: 1,
        subtitleSize: 100,
        audioBoost: 200,
        addDebugOverlay: 0,
        directStreamAudio: 1,
        mediaBufferSize: 102400,
        subtitles: "burn",
        "Accept-Language": "en",
        ...getXPlexProps(),
        ...(limitation.autoAdjustQuality && {
            autoAdjustQuality: limitation.autoAdjustQuality ? 1 : 0
        }),
        ...(limitation.maxVideoBitrate && {
            maxVideoBitrate: limitation.maxVideoBitrate
        })
    }
}

export async function putAudioStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`/library/parts/${partID}?${queryBuilder({
        audioStreamID: streamID,
        ...getXPlexProps()
    })}`, {});
}

export async function putSubtitleStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`/library/parts/${partID}?${queryBuilder({
        subtitleStreamID: streamID,
        ...getXPlexProps()
    })}`, {});
}

export async function getTimelineUpdate(itemID: number, duration: number, state: string, time: number): Promise<Plex.TimelineUpdateResult> {
    return await authedGet(`/:/timeline?${queryBuilder({
        ratingKey: itemID,
        key: `/library/metadata/${itemID}/`,
        duration: duration,
        state: state,
        playbackTime: time,
        time: time,
        context: "library",
        ...getXPlexProps()
    })}`);
}

export async function getServerPreferences(): Promise<Plex.ServerPreferences> {
    const res = await authedGet(`/`);
    return res.MediaContainer;
}

export async function getPlayQueue(uri: string): Promise<Plex.Metadata[]> {
    const res = await authedPost(`/playQueues?${queryBuilder({
        type: "video",
        uri,
        continuous: 1,
        ...getIncludeProps(),
        ...getXPlexProps()
    })}`);
    return res.MediaContainer.Metadata;
}

export function getTranscodeImageURL(url: string, width: number, height: number) {
    return `${localStorage.getItem(
        "server"
    )}/photo/:/transcode?${queryBuilder({
        width,
        height,
        minSize: 1,
        upscale: 1,
        url,
        "X-Plex-Token": localStorage.getItem("accessToken") as string,
    })}`;
}

export async function getAccessToken(pin: string): Promise<Plex.TokenData> {
    const res = await axios.get(`https://plex.tv/api/v2/pins/${pin}?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`)
    return res.data;
}

export async function getPin(): Promise<Plex.TokenData> {
    const res = await axios.post(`https://plex.tv/api/v2/pins?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID"),
        "X-Plex-Product": "PerPlexed"
    })}`)
    return res.data;
}

export async function getLoggedInUser(): Promise<Plex.UserData | null> {
    const res = await axios.get(`https://plex.tv/api/v2/user?${queryBuilder({
        "X-Plex-Token": localStorage.getItem("accAccessToken") as string,
        "X-Plex-Product": "PerPlexed",
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    });
    if (res.status === 200) return res.data;
    else return null;
}

export async function getSearch(query: string): Promise<Plex.SearchResult[]> {
    const res = await authedGet(`/library/search?${queryBuilder({
        query,
        "includeCollections": 1,
        "includeExtras": 1,
        "searchTypes": "movies,otherVideos,tv",
        "limit": 100,
        "X-Plex-Token": localStorage.getItem("accessToken") as string
    })}`);
    return res.MediaContainer.SearchResult;
}

export interface LibraryDir {
    title: string;
    library: string;
    Metadata: Plex.Metadata[];
}


export async function getItemByGUID(guid: string): Promise<Plex.Metadata | null> {
    const res = await authedGet(`/library/all?${queryBuilder({
        guid,
        "includeExternalMedia": 1,
        "includeMeta": 1,
        "includeMarkerCounts": 1,
        "includeRelated": 1,
        "X-Plex-Token": localStorage.getItem("accessToken") as string
    })}`);

    if(res.MediaContainer.Metadata?.[0]?.guid !== guid) return null;

    return res.MediaContainer.Metadata?.[0];
}
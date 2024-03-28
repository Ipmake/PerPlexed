import { authedGet, authedPost, authedPut, getXPlexProps, queryBuilder } from "./QuickFunctions";
import './plex.d.ts'

export async function getAllLibraries(): Promise<Plex.LibarySection[]> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/sections`);
    return res.MediaContainer.Directory;
}

export async function getLibrary(key: string): Promise<Plex.LibraryDetails> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/sections/${key}?${queryBuilder({
        includeDetails: 1,
        includeMarkers: 1,
        includeOnDeck: 1,
        includeChapters: 1,
    })}`);
    return res.MediaContainer;
}

export async function getLibraryMedia(key: string, directory: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/sections/${key}/${directory}`);
    return res.MediaContainer.Metadata;
}

export async function getLibrarySecondary(key: string, directory: string): Promise<Plex.Directory[]> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/sections/${key}/${directory}`);
    return res.MediaContainer.Directory;
}

export async function getLibraryMeta(id: string): Promise<Plex.Metadata> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/metadata/${id}?${queryBuilder({
        includeDetails: 1,
        includeMarkers: 1,
        includeOnDeck: 1,
        includeChapters: 1,
        includeChildren: 1,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`);
    return res.MediaContainer.Metadata[0];
}

export async function getLibraryMetaChildren(id: string): Promise<Plex.Metadata[]> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/metadata/${id}/children?${queryBuilder({
        includeDetails: 1,
        includeMarkers: 1,
        includeOnDeck: 1,
        includeChapters: 1,
        includeChildren: 1,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`);
    return res.MediaContainer.Metadata;

}

export async function getSimilar(id: string): Promise<Plex.Metadata[]> {
    if(!id) return [];
    const res = await authedGet(`${localStorage.getItem("server")}/library/metadata/${id}/similar?${queryBuilder({
        limit: 10,
        excludeFields: "summary",
        includeMarkerCounts: 1,
        includeRelated: 1,
        includeExternalMedia: 1,
        async: 1,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`);
    return res.MediaContainer.Metadata;
}

export async function getUniversalDecision(id: string, limitation: {
    autoAdjustQuality?: boolean,
    maxVideoBitrate?: number,
}): Promise<void> {
    await authedGet(`${localStorage.getItem("server")}/video/:/transcode/universal/decision?${queryBuilder({
        hasMDE: 1,
        path: "/library/metadata/" + id,
        mediaIndex: 0,
        partIndex: 0,
        protocol: "dash",
        fastSeek: 1,
        directPlay: 0,
        directStream: 1,
        subtitleSize: 100,
        audioBoost: 100,
        location: "lan",
        addDebugOverlay: 0,
        directStreamAudio: 1,
        mediaBufferSize: 102400,
        subtitles: "burn",
        "Accept-Language": "en",
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf"),
        ...(limitation.autoAdjustQuality && {
            autoAdjustQuality: limitation.autoAdjustQuality ? 1 : 0
        }),
        ...(limitation.maxVideoBitrate && {
            maxVideoBitrate: limitation.maxVideoBitrate
        })
    })}`);
    return;
}

export async function putAudioStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`${localStorage.getItem("server")}/library/parts/${partID}?${queryBuilder({
        audioStreamID: streamID,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`, {});
}

export async function putSubtitleStream(partID: number, streamID: number): Promise<void> {
    await authedPut(`${localStorage.getItem("server")}/library/parts/${partID}?${queryBuilder({
        subtitleStreamID: streamID,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`, {});
}

export async function getTimelineUpdate(itemID: number, duration: number, state: string, time: number): Promise<void> {
    await authedGet(`${localStorage.getItem("server")}/:/timeline?${queryBuilder({
        ratingKey: itemID,
        key: `/library/metadata/${itemID}/`,
        duration: duration,
        state: state,
        playbackTime: time,
        time: time,
        context: "library",
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`);
    return;
}

export async function getServerPreferences(): Promise<Plex.ServerPreferences> {
    const res = await authedGet(`${localStorage.getItem("server")}/`);
    return res.MediaContainer;
}

export async function getPlayQueue(uri: string): Promise<Plex.Metadata[]> {
    const res = await authedPost(`${localStorage.getItem("server")}/playQueues?${queryBuilder({
        type: "video",
        uri,
        continuous: 1,
        includeChapters: 1,
        includeMarkers: 1,
        includeGeolocation: 1,
        includeExternalMedia: 1,
        ...getXPlexProps("gazjqeiwe61k25cun3080ptf")
    })}`);
    return res.MediaContainer.Metadata;
}

export function getTranscodeImageURL(url: string, width: number, height: number) {
    return `${localStorage.getItem("server")}/photo/:/transcode?${queryBuilder({
        width,
        height,
        minSize: 1,
        upscale: 1,
        url,
        "X-Plex-Token": localStorage.getItem("accessToken") as string,
    })}`;
}

export async function getAccessToken(pin: string): Promise<Plex.TokenData> {
    const res = await authedGet(`https://plex.tv/api/v2/pins/${pin}?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`)

    return res;
}

export async function getPin(): Promise<Plex.TokenData> {
    const res = await authedPost(`https://plex.tv/api/v2/pins?${queryBuilder({
        "X-Plex-Client-Identifier": localStorage.getItem("clientID"),
        "X-Plex-Product": "perPlexed"
    })}`)
    return res;
}

export async function getLoggedInUser(): Promise<Plex.UserData> {
    const res = await authedGet(`https://plex.tv/api/v2/user?${queryBuilder({
        "X-Plex-Token": localStorage.getItem("accessToken") as string,
        "X-Plex-Product": "perPlexed",
        "X-Plex-Client-Identifier": localStorage.getItem("clientID")
    })}`)
    return res;
}

export async function getSearch(query: string): Promise<Plex.SearchResult[]> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/search?${queryBuilder({
        query,
        "X-Plex-Token": localStorage.getItem("accessToken") as string
    })}`);
    return res.MediaContainer.SearchResult;
}

export async function getLibraryDir(library: number, directory: string, subDir?: string): Promise<{
    title: string;
    library: string;
    Metadata: Plex.Metadata[];
}> {
    const res = await authedGet(`${localStorage.getItem("server")}/library/sections/${library}/${directory}/${subDir ?? ""}`);
    return {
        title: res.MediaContainer.title2,
        library: res.MediaContainer.title1,
        Metadata: res.MediaContainer.Metadata
    }
}
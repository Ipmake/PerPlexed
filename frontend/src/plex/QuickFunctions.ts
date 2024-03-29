import { useSessionStore } from "../states/SessionState";

export async function authedGet(url: string) {
    const res = await fetch(url, {
        headers: {
            'X-Plex-Token': localStorage.getItem("accessToken") as string,
            'accept': 'application/json',
        }
    })


    if (res.ok) return res.json();
    else return null;
}

export async function authedPost(url: string, body?: any) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'X-Plex-Token': localStorage.getItem("accessToken") as string,
            'accept': 'application/json'
        },
        body: body && JSON.stringify(body)
    })

    return res.json();

}

export async function authedPut(url: string, body: any) {
    await fetch(url, {
        method: 'PUT',
        headers: {
            'X-Plex-Token': localStorage.getItem("accessToken") as string,
            'accept': 'application/json'
        },
        body: JSON.stringify(body)
    })

    return;
}

export function queryBuilder(query: any) {
    return Object.keys(query)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k]))
        .join('&');
}

export function getXPlexProps(sessionID: string) {
    return {
        "X-Plex-Session-Identifier": sessionID,
        "X-Incomplete-Segments": "1",
        "X-Plex-Product": "PerPlexed",
        "X-Plex-Version": "0.1.0",
        "X-Plex-Client-Identifier": localStorage.getItem("clientID"),
        "X-Plex-Platform": "Firefox",
        "X-Plex-Platform-Version": "122.0",
        "X-Plex-Features": "external-media,indirect-media,hub-style-list",
        "X-Plex-Model": "bundled",
        "X-Plex-Device": "Linux",
        "X-Plex-Device-Name": "Firefox",
        "X-Plex-Device-Screen-Resolution": "1920x1080,1920x1080",
        "X-Plex-Token": localStorage.getItem("accessToken"),
        "X-Plex-Language": "en",
        "X-Plex-Session-Id": "e41474b9-aeb5-432d-a30c-24814fe44788",
        "session": useSessionStore.getState().sessionID
    }
}

export function makeid(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
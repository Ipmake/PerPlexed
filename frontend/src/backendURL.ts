import axios from "axios";
import { config } from ".";

export const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

export function getBackendURL() {
    if (isDev) return "http://localhost:3000";
    else return "";
}

export function ProxiedRequest(url: string, method: "GET" | "POST" | "PUT", headers?: Record<string, string>, data?: any) {
    const DISABLE_PROXY = config.DISABLE_PROXY === true ?? false;

    if(DISABLE_PROXY) return axios({ url: (localStorage.getItem("server") + url), method, headers, data }).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    })

    return axios.post(`${getBackendURL()}/proxy`, { url, method, headers, data }).catch((err) => {
        console.log(err);
        return { status: err.response?.status || 500, data: err.response?.data || 'Internal server error' }
    })
}
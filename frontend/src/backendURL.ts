export function getBackendURL() {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') return "http://localhost:3000";
    else return "";
}
import { detect } from "detect-browser";

const browser = detect();

export const shouldForceWebsockets = () => {
    switch (browser.name) {
        // Internet Explorer
        case 'ie':

        // Anything iOS related
        case 'ios':
        case 'ios-webview':
        case 'crios':

        // Safari
        case 'safari':

        // NodeJS
        case 'node':
            console.log("[SocketClient] Enabling \"forceWebsockets\" by default for compatibility with this environment.");
            return true;

        default:
            return false;
    }
}
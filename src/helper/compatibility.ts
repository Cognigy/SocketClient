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

        // Chrome
        case 'chrome':
        case 'chromium-webview':

        // NodeJS
        case 'node':
            console.log("[SocketClient] Enabling \"forceWebsockets\" by default for compatibility with this environment.");
            return true;


		// since it seems that no http polling is working for any setup currently (possible reason: https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session)
		// we are disabling polling for all browsers for now
		// former default: return false;
        default:
			return true;
    }
}
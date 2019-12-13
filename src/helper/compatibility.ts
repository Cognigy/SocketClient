import { detect } from "detect-browser";

const browser = detect();

export const shouldForceWebsockets = () => {
    if (browser.name === 'ie')
        return true;

    if (browser.name === 'safari')
        return true;

    return false;
}
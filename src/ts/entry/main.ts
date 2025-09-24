import { pages } from "#pages/main";
import { connectToDevServer } from "../helpers/devServerConnection.ts";
import { handleMainPages } from "../helpers/pages/handleMainPages.ts";
import { info, warn } from "../utils/console.ts";
import currentUrl from "../utils/currentUrl.ts";
import { messageListeners } from "#pages/main-listeners";
import { handleBackgroundListeners } from "../helpers/pages/handleBackgroundListeners.ts";
import { isIframe } from "../utils/context.ts";

if (import.meta.env.IS_DEV_WS_ACCESSIBLE) {
	connectToDevServer(["CSS", "JS", "IMG"], (type) => {
		for (const el of document.querySelectorAll<
			HTMLScriptElement | HTMLStyleElement | HTMLLinkElement | HTMLImageElement
		>(`[data-rosealdev-refresh="${type}"]`)) {
			const link = "href" in el ? el.href : "src" in el ? el.src : undefined;
			if (!link) {
				continue;
			}

			const newLink = `${link.split("?")[0]}?${Date.now()}`;
			if ("href" in el) {
				el.href = newLink;
			} else if ("src" in el) {
				el.src = newLink;
			}
		}
	});
}

let started = false;
handleMainPages(
	pages,
	currentUrl.value.siteType?.name === "www"
		? ".request-error-page-content:not(.roseal-error-page)"
		: undefined,
).then(() => {
	started = true;

	if (!isIframe)
		info(`The beautiful ${import.meta.env.VERSION_NAME} Seal is ready to seal your Roblox website experience.
Took ${(performance.now() / 1000).toFixed(3)}s to start.`);
});
let path = currentUrl.value.path.path;
currentUrl.subscribe(() => {
	const newPath = currentUrl.value.path.path;
	if (newPath !== path) {
		path = newPath;
		handleMainPages(pages);
	}
});

handleBackgroundListeners(messageListeners);

setTimeout(() => {
	if (!started) {
		warn(
			`Uh oh... RoSeal hasn't started yet after ${(performance.now() / 1000).toFixed(
				3,
			)}s. This is probably a RoSeal bug. Please report this in our Discord.`,
		);
	}
}, 2_000);

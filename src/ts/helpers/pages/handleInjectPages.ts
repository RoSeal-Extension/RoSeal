import { isIframe } from "src/ts/utils/context";
import currentUrl from "../../utils/currentUrl";
import { multiOnSet } from "../hijack/utils";
import type { Page } from "./handleMainPages";

const previousHandledPages: {
	page: Page;
	cleanup?: () => void;
}[] = [];

let processedOnce = false;

async function filterPage(page: Page) {
	if (isIframe && !page.runInIframe) {
		return null;
	}

	const matches: RegExpMatchArray[] = [];
	if (!page.isAllPages && page.regex) {
		for (const regex of page.regex) {
			const path = currentUrl.value.path;
			const value = path.realPath.match(regex) || path.path.match(regex);
			if (value) {
				matches.push(value);
			}
		}
	}

	if (
		((!page.sites && currentUrl.value.siteType?.name === "www") ||
			(currentUrl.value.siteType?.name &&
				page.sites?.includes(currentUrl.value.siteType.name))) &&
		(page.isAllPages || matches.length > 0)
	) {
		return {
			page,
			matches,
			dependencies: page.globalDependencies
				? multiOnSet(window, page.globalDependencies)
				: {},
		};
	}

	return null;
}

export async function handleInjectPages(pages: Page[], promise?: Promise<unknown>) {
	// Check if hot-swappable pages still match
	for (let i = previousHandledPages.length - 1; i >= 0; i--) {
		const handled = previousHandledPages[i];

		if (handled.page.hotSwappable) {
			const stillMatches = await filterPage(handled.page)
				.then((result) => !!result)
				.catch(() => false);

			if (!stillMatches) {
				if (handled.cleanup) {
					handled.cleanup();
				}
				previousHandledPages.splice(i, 1);
			}
		}
	}

	const resultsPromises = [];
	for (const page of pages) {
		// Skip already handled hot-swappable pages
		if (
			processedOnce &&
			(!page.hotSwappable ||
				previousHandledPages.find((handled) => handled.page.id === page.id))
		) {
			continue;
		}

		resultsPromises.push(
			filterPage(page).then(async (result) => {
				if (!result) return;

				if (promise) {
					await promise;
				}

				let cleanup: (() => void) | undefined | void;
				if (page.globalDependencies) {
					const data = await result.dependencies;
					// Properly await the async function result
					cleanup = await page.fn({
						regexMatches: result.matches,
						dependencies: data,
					});
				} else {
					// Properly await the async function result
					cleanup = await page.fn({
						regexMatches: result.matches,
					});
				}

				if (cleanup) {
					previousHandledPages.push({
						page,
						cleanup,
					});
				}
			}),
		);
	}

	processedOnce = true;
	await Promise.all(resultsPromises);
}

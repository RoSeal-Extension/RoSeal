import { isIframe } from "src/ts/utils/context";
import currentUrl from "../../utils/currentUrl";
import type { SiteType } from "../../utils/url";
import { watch, watchOnce } from "../elements";
import type { AnyFeature } from "../features/featuresData";
import { multigetFeaturesValues } from "../features/helpers";
import { multiOnSet } from "../hijack/utils";
import { getHomePageDocument } from "../requests/services/misc";
import { handleScriptGroups, insertCSS, type InjectScriptGroup } from "./utils/inject";

export type CSSSwitch = {
	css: string[];
	featureIds: AnyFeature["id"][];
};

export type Page<T extends keyof Window = never> = {
	id: string;
	regex?: RegExp[];
	featureIds?: AnyFeature["id"][];
	isCustomPage?: boolean;
	isAllPages?: boolean;
	css?: (string | CSSSwitch)[];
	sites?: SiteType[];
	globalDependencies?: T[];
	injectScripts?: InjectScriptGroup[];
	runInIframe?: boolean;
	hotSwappable?: boolean;
	fn: (param: {
		dependencies?: Pick<Window, T>;
		regexMatches?: RegExpMatchArray[];
	}) => MaybePromise<void | (() => void)>;
};

let errorElement: HTMLElement | undefined;
let removeErrorCancelled = false;
const previousHandledPages: {
	page: Page;
	cleanup?: () => void;
	insertedCSS: Set<HTMLLinkElement>;
}[] = [];

function remountErrorPage() {
	removeErrorCancelled = true;
	if (errorElement)
		watchOnce(".content").then((content) => errorElement && content.append(errorElement));
}

async function handlePage(
	page: Page,
	regexMatches?: RegExpMatchArray[],
	dependencies?: MaybePromise<object>,
	waitFor?: Promise<unknown>,
) {
	if (waitFor) {
		await waitFor;
	}

	const deps = await dependencies;

	const result = await page.fn({
		dependencies: deps,
		regexMatches,
	});

	return typeof result === "function" ? result : undefined;
}

let processedOnce = false;
async function filterPage(
	page: Page,
	setWatchForErrorPage: (valid: MaybePromise<boolean>) => void,
) {
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
		const featuresValid =
			!page.featureIds ||
			multigetFeaturesValues(page.featureIds).then((value) =>
				Object.values(value).includes(true),
			);
		if (page.isCustomPage) setWatchForErrorPage(featuresValid);

		if (await featuresValid) {
			return {
				page,
				matches,

				dependencies: page.globalDependencies
					? multiOnSet(window, page.globalDependencies)
					: {},
				insertScripts: page.injectScripts && handleScriptGroups(page.injectScripts),
			};
		}
	}
	return null;
}

export async function handleMainPages(
	pages: Page[],
	errorSelector?: string,
	promise?: Promise<unknown>,
) {
	for (let i = previousHandledPages.length - 1; i >= 0; i--) {
		const handled = previousHandledPages[i];
		if (handled.page.hotSwappable) {
			const stillMatches = await filterPage(handled.page, () => {})
				.then((result) => result !== null)
				.catch(() => false);

			if (!stillMatches) {
				if (handled.cleanup) {
					handled.cleanup();
				}

				for (const css of handled.insertedCSS) {
					css.remove();
				}

				previousHandledPages.splice(i, 1);
			}
		}
	}

	const watchForErrorPage: MaybePromise<boolean>[] = [];
	const resultsPromises = [];

	for (const page of pages) {
		if (
			processedOnce &&
			(!page.hotSwappable ||
				previousHandledPages.find((handled) => handled.page.id === page.id))
		) {
			continue;
		}

		resultsPromises.push(
			filterPage(page, (value) => {
				if (!watchForErrorPage.length) {
					const bundleSelectors = [
						[
							"pageEnd",
							"CrossTabCommunication",
							"PresenceRegistration",
							"Contacts",
							"leanbase",
							"UserProfiles",
						].map((item) => `[data-bundlename*="${item}"]`),
						['[data-bundlename*="Chat"]'],
					];

					handleScriptGroups([
						{
							document: getHomePageDocument,
							selectors: bundleSelectors,
						},
					]);

					if (errorSelector) {
						watch(errorSelector, (element) => {
							if (!removeErrorCancelled) {
								element.remove();
								errorElement = element;
							}
						});
					}
				}
				watchForErrorPage.push(value);
			}).then(async (result) => {
				if (!result) return;

				if (promise) await promise;

				const cleanup = await handlePage(
					result.page,
					result.matches,
					result.dependencies,
					result.insertScripts,
				);

				const insertedCSS = new Set<HTMLLinkElement>();

				if (result.page.css) {
					for (const css of result.page.css) {
						if (typeof css === "string") {
							insertedCSS.add(insertCSS(css));
						} else {
							multigetFeaturesValues(css.featureIds).then((value) => {
								if (Object.values(value).includes(true)) {
									for (const target of css.css) {
										insertedCSS.add(insertCSS(target));
									}
								}
							});
						}
					}
				}

				previousHandledPages.push({
					page: result.page,
					cleanup,
					insertedCSS,
				});
			}),
		);
	}

	await Promise.all(resultsPromises);
	processedOnce = true;

	if (watchForErrorPage.length && !(await Promise.all(watchForErrorPage)).includes(true)) {
		remountErrorPage();
	}
}

import type { InjectScript } from "src/ts/utils/dom";
import { invokeMessage } from "../../communication/dom";
import type { AnyFeature } from "../../features/featuresData";
import { multigetFeaturesValues } from "../../features/helpers";
import { watchOnce } from "../../elements";

export type InjectScriptGroup = {
	document: () => MaybePromise<Document>;
	dependent?: boolean;
	selectors: string[][];
	featureIds?: AnyFeature["id"][];
};

export async function handleScriptGroup(injectScript: InjectScriptGroup) {
	const document = await injectScript.document();

	for (const selectors of injectScript.selectors) {
		const sendScripts: InjectScript[] = [];
		for (const script of document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
			selectors.join(", "),
		)) {
			const data: InjectScript = {
				tagName: script.tagName as "SCRIPT" | "LINK",
			};
			for (const attr of script.attributes) {
				data[attr.name] = attr.value;
			}
			sendScripts.push(data);
		}

		if (sendScripts.length) {
			await invokeMessage("injectScripts", sendScripts);
		}
	}
}

export async function handleScriptGroups(injectScripts: InjectScriptGroup[]) {
	for (const injectScript of injectScripts) {
		if (
			injectScript.featureIds &&
			!Object.values(await multigetFeaturesValues(injectScript.featureIds)).includes(true)
		) {
			continue;
		}

		const value = handleScriptGroup(injectScript);
		if (injectScript.dependent) {
			await value;
		}
	}
}

export function insertCSS(url: string) {
	const style = document.createElement("link");
	style.href = url.startsWith("https:")
		? url
		: `${browser.runtime.getURL(url)}?${import.meta.env.VERSION}`;

	style.type = "text/css";
	style.rel = "stylesheet";
	if (import.meta.env.IS_DEV_WS_ACCESSIBLE) {
		style.dataset.rosealdevRefresh = "CSS";
	}

	if (document.body) {
		(document.head ?? document.documentElement).appendChild(style);
		return style;
	}

	const clone = style.cloneNode() as HTMLLinkElement;
	(document.head ?? document.documentElement).appendChild(clone);

	watchOnce("body").then(() => {
		style.addEventListener(
			"load",
			() => {
				clone.remove();
			},
			{
				once: true,
			},
		);

		(document.head ?? document.documentElement).appendChild(clone);
	});

	return style;
}

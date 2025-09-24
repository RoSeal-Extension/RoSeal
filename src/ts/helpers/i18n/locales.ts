import messages from "#i18n";
import currentUrl from "src/ts/utils/currentUrl.ts";
import { PREFERRED_LOCALES_STORAGE_KEY } from "../../constants/i18n.ts";
import { getUrgentStorage, storage } from "../storage.ts";
import overrideMessages from "./overrideMessages.ts";
import { error } from "src/ts/utils/console.ts";

if (import.meta.env.IS_DEV && Object.keys(overrideMessages).length) {
	for (const [key, value] of Object.entries(overrideMessages)) {
		messages[key] = {
			en: value as string,
		};
	}
}

const navigatorLanguages = import.meta.env.ENV !== "background" ? [...navigator.languages] : [];

try {
	const split = navigator.language.split("-");
	if (split.length === 2 && Intl.getCanonicalLocales(split[0]).length === 1) {
		navigatorLanguages.splice(1, 0, split[0]);
	}
} catch {}

const localeData = (
	"main" === import.meta.env.ENV ||
	(import.meta.env.TARGET_BASE === "firefox" && import.meta.env.ENV === "popup")
		? getUrgentStorage<string[] | undefined>(PREFERRED_LOCALES_STORAGE_KEY)
		: "popup" === import.meta.env.ENV
			? [currentUrl.value.url.searchParams.get("locales")?.split(",")]
			: undefined
) as [string[] | undefined, ((locales?: string[]) => void) | undefined] | undefined;

export const backgroundLocalesLoaded =
	import.meta.env.ENV === "background"
		? storage
				.get([PREFERRED_LOCALES_STORAGE_KEY])
				.then((data) => {
					const locales = data[PREFERRED_LOCALES_STORAGE_KEY] as string[] | undefined;
					if (!locales) return;

					for (let i = locales.length - 1; i >= 0; i--) {
						const locale = locales[i];
						if (!locale) continue;

						const existingIndex = locales.indexOf(locale);

						if (existingIndex !== -1) {
							locales.splice(existingIndex, 1);
						}
						locales.unshift(locale);
					}
				})
				.catch((err) => {
					error("Failed to get preferred locales in the background", err);
				})
		: undefined;

export const locales: string[] = ["en"];
for (let i = navigatorLanguages.length - 1; i >= 0; i--) {
	const locale = navigatorLanguages[i];
	if (!locale) continue;

	const existingIndex = locales.indexOf(locale);

	if (existingIndex !== -1) {
		locales.splice(existingIndex, 1);
	}
	locales.unshift(locale);
}

if (localeData?.[0]?.length) {
	for (let i = localeData[0].length - 1; i >= 0; i--) {
		const locale = localeData[0][i];
		if (!locale) continue;

		const existingIndex = locales.indexOf(locale);

		if (existingIndex !== -1) {
			locales.splice(existingIndex, 1);
		}
		locales.unshift(locale);
	}
}

export const initialLocalesFetch =
	import.meta.env.ENV === "background"
		? storage.get(PREFERRED_LOCALES_STORAGE_KEY).then((data) => {
				if (data[PREFERRED_LOCALES_STORAGE_KEY]) {
					locales.unshift(...data[PREFERRED_LOCALES_STORAGE_KEY]);
				}
			})
		: undefined;

const setLocales = localeData?.[1];
export { setLocales };

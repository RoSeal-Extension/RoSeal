import { hijackFunction, onSet } from "../helpers/hijack/utils";

let hasOverrideReactYet = false;
const overrides: Record<string, string> = {};

function overrideReactI18n() {
	if (hasOverrideReactYet) return;

	hasOverrideReactYet = true;
	onSet(window, "Roblox")
		.then((roblox) => onSet(roblox, "core-scripts"))
		.then((coreScripts) => onSet(coreScripts, "intl"))
		.then((intl) => onSet(intl, "translation"))
		.then((translation) => {
			hijackFunction(
				translation.TranslationResource.prototype,
				(target, thisArg, args) => {
					const override = overrides[args[0]];
					if (override) return override;

					return target.apply(thisArg, args);
				},
				"get",
			);
		});
}

export function overrideRobloxMessages(namespace: string, values: Record<string, string>) {
	if (document.readyState !== "loading") {
		overrideReactI18n();
		for (const key in values) {
			overrides[key] = values[key];
		}

		return;
	}
	return onSet(window, "Roblox").then((roblox) =>
		Promise.any([
			onSet(roblox, "LangDynamic").then((dynamic) =>
				onSet(dynamic, namespace).then((value) => {
					for (const key in values) {
						value[key] = values[key];
					}
				}),
			),
			onSet(roblox, "LangDynamicDefault").then((dynamic) =>
				onSet(dynamic, namespace).then((value) => {
					for (const key in values) {
						value[key] = values[key];
					}
				}),
			),
		]),
	);
}

export function getRobloxI18nNamespace(namespace: string) {
	return onSet(window, "Roblox").then((roblox) => {
		return Promise.any([
			onSet(roblox, "LangDynamic"),
			onSet(roblox, "LangDynamicDefault"),
			// DO NOT UNCOMMENT
			//onSet(roblox, "Lang"),
		]).then((obj) => onSet(obj, namespace));
	});
}

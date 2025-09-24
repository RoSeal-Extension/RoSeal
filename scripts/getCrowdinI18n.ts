import data from "../src/i18n/locales/en/messages.json";
import type { I18nFile } from "./build/constants";
import { handleI18NNamespace } from "./build/utils";

const formattedData = handleI18NNamespace(
	data as unknown as I18nFile,
	["main", "inject", "popup", "roseal", "background", "manifest"],
	undefined,
	undefined,
	true,
);

const newData: Record<
	string,
	{
		defaultMessage?: string;
		description?: string;
	}
> = {};

for (const key in formattedData) {
	newData[key] = {
		defaultMessage: formattedData[key].message,
		description: formattedData[key].$context,
	};
}

await Bun.write("builds-dist/RoSeal-Extension-i18n.json", JSON.stringify(newData, null, 2));

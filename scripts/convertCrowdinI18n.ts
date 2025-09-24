import { readdir } from "fs-extra";
import type { I18nDetail } from "./build/constants";

const sourceData = await Bun.file("./src/i18n/locales/en/messages.json").json();

function iterateNamespace(
	sourceData: Record<string, I18nDetail | string>,
	data: Record<
		string,
		{
			defaultMessage: string;
		}
	>,
	namespace?: string,
) {
	for (const key in sourceData) {
		const value = sourceData[key];
		const setKey = namespace ? `${namespace}.${key}` : key;

		if (typeof key === "string" && key.startsWith("$")) {
			continue;
		}

		if (typeof value === "string") {
			sourceData[key] = data[setKey]?.defaultMessage ?? value;
		} else if (typeof value === "object") {
			if (value.$message?.length) {
				// @ts-expect-error: Fine
				sourceData[key].$message = data[setKey]?.defaultMessage ?? value.$message;
			}

			iterateNamespace(value, data, setKey);
		}
	}
}

for (const file of await readdir("./src/i18n/locales/")) {
	if (file === "en") continue;

	const path = `./src/i18n/locales/${file}/messages.json`;
	const data = await Bun.file(path).json();

	const stringifiedData = JSON.stringify(data, null, 2);
	if (stringifiedData.includes("$message") || !stringifiedData.includes("defaultMessage")) {
		// temp fix
		continue;
	}

	iterateNamespace(sourceData, data);

	await Bun.write(path, JSON.stringify(sourceData, null, 2));
}

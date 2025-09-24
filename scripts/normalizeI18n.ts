import messages from "../src/i18n/locales/en/messages.json";
import type { I18nDetail } from "./build/constants";

function iterate(messages: Record<string, I18nDetail | string>) {
	for (const key in messages) {
		if (key.startsWith("$")) {
			continue;
		}

		if (typeof messages[key] === "string") {
			messages[key] = {
				$message: messages[key],
				$context: "",
			};

			continue;
		}
		if (typeof messages[key] === "object") {
			if (messages[key].$message && !messages[key].$context) {
				messages[key].$context = "";
			}
			iterate(messages[key]);
		}
	}
}

iterate(messages as unknown as Record<string, I18nDetail | string>);
await Bun.write("../src/i18n/locales/en/messages.json", JSON.stringify(messages, null, 4));

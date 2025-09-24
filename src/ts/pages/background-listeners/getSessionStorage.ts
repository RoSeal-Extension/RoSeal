import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "getSessionStorage",
	fn: (key) => {
		return browser.storage.session.get(key);
	},
} satisfies BackgroundMessageListener<"getSessionStorage">;

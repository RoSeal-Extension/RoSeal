import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "removeSessionStorage",
	fn: (keys) => {
		return browser.storage.session.remove(keys);
	},
} satisfies BackgroundMessageListener<"removeSessionStorage">;

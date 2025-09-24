import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "setSessionStorage",
	fn: (values) => {
		return browser.storage.session.set(values);
	},
} satisfies BackgroundMessageListener<"setSessionStorage">;

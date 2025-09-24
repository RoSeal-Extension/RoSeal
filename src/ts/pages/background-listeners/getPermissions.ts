import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "getPermissions",
	fn: () => {
		return browser.permissions.getAll();
	},
} satisfies BackgroundMessageListener<"getPermissions">;

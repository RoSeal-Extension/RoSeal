import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "openOptionsPage",
	fn: () => browser.runtime.openOptionsPage(),
} satisfies BackgroundMessageListener<"openOptionsPage">;

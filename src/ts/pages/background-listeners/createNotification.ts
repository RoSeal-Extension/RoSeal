import type { BackgroundMessageListener } from "src/types/dataTypes";

export default {
	action: "createNotification",
	fn: (data) => browser.notifications?.create(data.id, data.notification),
} satisfies BackgroundMessageListener<"createNotification">;

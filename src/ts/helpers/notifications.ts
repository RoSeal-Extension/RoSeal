import { addMessageListener } from "./communication/dom";
import type { RealtimeNotifications } from "./requests/services/notifications";
import type { UserPresence } from "./requests/services/users";

export function onNotificationType<
	T extends RealtimeNotifications[0],
	U extends Extract<RealtimeNotifications, [T, unknown]>[1],
>(type: T, fn: (data: U) => void) {
	return addMessageListener("realtimeNotification", (data) => {
		if (data.type === type) {
			fn(data.data as U);
		}
	});
}

export function onRobloxPresenceUpdateDetails(fn: (data: UserPresence[]) => void) {
	const listener = (data: CustomEvent<UserPresence[]>) => fn(data.detail);

	// @ts-expect-error: fine
	document.addEventListener("Roblox.Presence.Update", listener);

	return () => {
		// @ts-expect-error: fine
		document.removeEventListener("Roblox.Presence.Update", listener);
	};
}

export function onRobloxPresenceUpdate(fn: (data: number[]) => void) {
	return onNotificationType("PresenceBulkNotifications", (data) => {
		const userIds: number[] = [];
		for (const item of data) {
			if (item.Type === "PresenceChanged") userIds.push(item.UserId);
		}

		fn(userIds);
	});
}

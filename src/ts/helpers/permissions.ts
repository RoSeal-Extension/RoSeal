import { signal } from "@preact/signals";
import { invokeMessage } from "./communication/background";

export const currentPermissions = signal<MaybePromise<chrome.permissions.Permissions | undefined>>(
	("permissions" in browser
		? browser.permissions.getAll()
		: invokeMessage("getPermissions", undefined)
	).then((value) => {
		currentPermissions.value = value;

		return value;
	}),
);

if ("permissions" in browser && import.meta.env.ENV !== "background") {
	browser.permissions.onAdded.addListener(async () => {
		currentPermissions.value = await browser.permissions.getAll();
	});
	browser.permissions.onRemoved.addListener(async () => {
		currentPermissions.value = await browser.permissions.getAll();
	});
}

export async function hasPermissions(
	checkPermissions: chrome.permissions.Permissions,
	checkAgainst?: MaybePromise<chrome.permissions.Permissions>,
) {
	if (!checkPermissions.permissions && !checkPermissions.origins) {
		return true;
	}

	const awaitedPermissions = await (checkAgainst ?? currentPermissions.value);
	if (checkPermissions.permissions) {
		for (const permission of checkPermissions.permissions) {
			if (!awaitedPermissions?.permissions?.includes(permission)) {
				return false;
			}
		}
	}

	if (checkPermissions.origins) {
		for (const origin of checkPermissions.origins) {
			if (!awaitedPermissions?.origins?.includes(origin)) {
				return false;
			}
		}
	}

	return true;
}

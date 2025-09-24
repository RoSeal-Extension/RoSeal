import type { Signal } from "@preact/signals";
import type { ArchivedItemsItem } from "../constants/misc";
import { hijackResponse } from "../helpers/hijack/fetch";
import { getRobloxUrl } from "../utils/baseUrls" with { type: "json" };
import type {
	ListUserInventoryAssetsDetailedResponse,
	ListUserInventoryBundlesResponse,
} from "../helpers/requests/services/inventory";
import type {
	ListUserAvatarOutfitsResponse,
	ListUserAvatarItemsResponse,
} from "../helpers/requests/services/avatar";

export function handleArchivedItems(signal: Signal<ArchivedItemsItem[]>) {
	const INVENTORY_ASSETS_V2_REGEX = /^\/v2\/users\/\d+\/inventory(\/\d+)?$/;
	const INVENTORY_BUNDLES_SUBTYPE_REGEX = /^\/v1\/users\/\d+\/bundles(\/\d+)?$/;
	const AVATAR_INVENTORY_REGEX = /^\/v1\/avatar-inventory$/;
	const CHARACTERS_REGEX = /^\/v2\/avatar\/users\/\d+\/outfits$/;

	/*
	Disabled due to Roblox bug where >50 and <50 do not have pages
	hijackRequest((req) => {
		const url = new URL(req.url);

		if (url.hostname === getRobloxUrl("avatar")) {
			if (AVATAR_INVENTORY_REGEX.test(url.pathname)) {
				url.searchParams.set("pageLimit", "50");

				return new Request(url.toString(), req);
			}
		}
	});*/

	hijackResponse(async (req, res) => {
		if (!res) return;

		const url = new URL(req.url);
		if (url.hostname === getRobloxUrl("inventory")) {
			if (INVENTORY_ASSETS_V2_REGEX.test(url.pathname)) {
				const data = (await res.clone().json()) as ListUserInventoryAssetsDetailedResponse;
				for (let i = 0; i < data.data.length; i++) {
					const item = data.data[i];
					let shouldRemove = false;
					for (const item2 of signal.value) {
						if (item2.id === item.assetId && item2.type === "Asset") {
							shouldRemove = true;
							break;
						}
					}

					if (shouldRemove) {
						data.data.splice(i, 1);
						i--;
					}
				}

				return new Response(JSON.stringify(data), res);
			}
		} else if (url.hostname === getRobloxUrl("catalog")) {
			if (INVENTORY_BUNDLES_SUBTYPE_REGEX.test(url.pathname)) {
				const data = (await res.clone().json()) as ListUserInventoryBundlesResponse;
				for (let i = 0; i < data.data.length; i++) {
					const item = data.data[i];
					let shouldRemove = false;
					for (const item2 of signal.value) {
						if (item2.id === item.id && item2.type === "Bundle") {
							shouldRemove = true;
							break;
						}
					}

					if (shouldRemove) {
						data.data.splice(i, 1);
						i--;
					}
				}

				return new Response(JSON.stringify(data), res);
			}
		} else if (url.hostname === getRobloxUrl("avatar")) {
			if (CHARACTERS_REGEX.test(url.pathname)) {
				const data = (await res.clone().json()) as ListUserAvatarOutfitsResponse;
				for (let i = 0; i < data.data.length; i++) {
					const item = data.data[i];
					if (item.isEditable) continue;

					let shouldRemove = false;
					for (const item2 of signal.value) {
						if (item2.id === item.id && item2.type === "UserOutfit") {
							shouldRemove = true;
							break;
						}
					}

					if (shouldRemove) {
						data.data.splice(i, 1);
						i--;
					}
				}

				return new Response(JSON.stringify(data), res);
			}

			if (AVATAR_INVENTORY_REGEX.test(url.pathname)) {
				const data = (await res.clone().json()) as ListUserAvatarItemsResponse;

				for (let i = 0; i < data.avatarInventoryItems.length; i++) {
					const item = data.avatarInventoryItems[i];

					let shouldRemove = false;
					for (const item2 of signal.value) {
						if (item2.type === "Asset") {
							if (item.itemCategory?.itemType === 1 && item.itemId === item2.id) {
								shouldRemove = true;
								break;
							}
						} else if (item2.type === "Bundle") {
							if (item.itemCategory?.itemType === 2 && item.itemId === item2.id) {
								shouldRemove = true;
								break;
							}
						} else if (item2.type === "UserOutfit") {
							if (item.itemCategory?.itemType === 3 && item.itemId === item2.id) {
								shouldRemove = true;
								break;
							}
						}
					}

					if (shouldRemove) {
						data.avatarInventoryItems.splice(i, 1);
						i--;
					}
				}

				return new Response(JSON.stringify(data), res);
			}
		}
	});
}

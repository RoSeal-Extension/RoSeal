import { hijackRequest } from "../helpers/hijack/fetch";
import { hijackFunction, onSet } from "../helpers/hijack/utils";
import type { ListUserInventoryCategoriesResponse } from "../helpers/requests/services/inventory";
import { getRobloxUrl } from "../utils/baseUrls" with { type: "macro" };
import { bundleTypes } from "../utils/itemTypes";

const INVENTORY_CATEGORIES_API_REGEX = /^\/v1\/users\/(\d+)\/categories(\/favorites)?$/;

export function handleInventoryFavoritesCategories(data: ListUserInventoryCategoriesResponse) {
	hijackRequest((req) => {
		const url = new URL(req.url);
		if (url.hostname === getRobloxUrl("inventory")) {
			if (INVENTORY_CATEGORIES_API_REGEX.test(url.pathname)) {
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: {
						"content-type": "application/json",
					},
				});
			}
		}
	});

	onSet(window, "angular").then((angular) => {
		hijackFunction(
			angular,
			(target, thisArg, args) => {
				const result = target.apply(thisArg, args);

				hijackFunction(
					result,
					(target, thisArg, constantArgs) => {
						if (args[0] === "assetsExplorer" && constantArgs[0] === "assetsConstants") {
							// @ts-expect-error: fine
							const value = constantArgs[1];
							if (value) {
								for (const bundle of bundleTypes) {
									// @ts-expect-error: fine
									value.bundleMarketplaceCategoryMapping[bundle.bundleTypeId] =
										bundle.searchQuery;
								}
							}
						}

						return target.apply(thisArg, constantArgs);
					},
					"constant",
				);

				return result;
			},
			"module",
		);
	});
}

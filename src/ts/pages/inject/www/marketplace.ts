import { sendMessage } from "src/ts/helpers/communication/dom";
import { getMessagesInject } from "src/ts/helpers/domInvokes";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type {
	GetSearchNavigationMenusResponse,
	MarketplaceItemType,
	MultigetAvatarItemsResponse,
	SearchNavigationMenuCategory,
} from "src/ts/helpers/requests/services/marketplace";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { assetTypes } from "src/ts/utils/itemTypes";
import { AVATAR_MARKETPLACE_REGEX } from "src/ts/utils/regex";
import type messagesType from "#i18n/types";
import { hijackState } from "src/ts/helpers/hijack/react";

const ROSEAL_CUSTOM_CATEGORY_ID = 12252022;

export default {
	id: "marketplace",
	regex: [AVATAR_MARKETPLACE_REGEX],
	hotSwappable: true,
	fn: () => {
		const checks: MaybeDeepPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];

		checks.push(
			featureValueIsInject("marketplaceShowHiddenCategories", true, () => {
				const res = hijackResponse(async (req, res) => {
					if (!res) return;

					const url = new URL(req.url);
					if (
						url.hostname === getRobloxUrl("catalog") &&
						url.pathname === "/v1/search/navigation-menu-items"
					) {
						const data = (await res.clone().json()) as GetSearchNavigationMenusResponse;
						const last = data.categories.at(-1);
						if (!last) return;

						const allAssetTypeIds: number[] = [];
						for (const category of data.categories) {
							if (category.assetTypeIds.length) {
								allAssetTypeIds.push(...category.assetTypeIds);
							}
						}

						const messages: (keyof typeof messagesType)[] = [
							"marketplace.categories.hidden.title",
						];

						for (const assetType of assetTypes) {
							if (
								assetType.isAvatarAsset &&
								!allAssetTypeIds.includes(assetType.assetTypeId)
							) {
								messages.push(
									`assetTypes.category.${assetType.assetTypeId}` as keyof typeof messagesType,
								);
							}
						}

						const messagesData = await getMessagesInject(messages);

						const category: SearchNavigationMenuCategory = {
							categoryId: ROSEAL_CUSTOM_CATEGORY_ID,
							assetTypeIds: [],
							bundleTypeIds: [],
							name: messagesData[0],
							orderIndex: last.orderIndex + 1,
							isSearchable: true,
							subcategories: [],
						};

						let index = 1;

						for (const assetType of assetTypes) {
							if (
								assetType.isAvatarAsset &&
								!allAssetTypeIds.includes(assetType.assetTypeId)
							) {
								category.assetTypeIds.push(assetType.assetTypeId);
								category.subcategories.push({
									subcategoryId: assetType.assetTypeId,
									subcategory: assetType.assetType,
									assetTypeIds: [assetType.assetTypeId],
									bundleTypeIds: [],
									name: messagesData[index++] || assetType.assetType,
									shortName: null,
								});
							}
						}

						if (!category.subcategories.length) return;

						data.categories.push(category);

						return new Response(JSON.stringify(data), res);
					}
				});

				const state = hijackState({
					matches: (state) =>
						typeof state === "object" &&
						state !== null &&
						"category" in state &&
						typeof state.category === "object" &&
						state.category !== null &&
						"categoryId" in state.category &&
						state.category.categoryId === ROSEAL_CUSTOM_CATEGORY_ID,
					setState: ({ value }) => {
						return {
							...(value.current as Record<string, string>),
							includeNotForSale: true,
						};
					},
				});

				return () => {
					state();
					res();
				};
			}),
		);

		checks.push(
			featureValueIsInject("marketplaceShowQuantityRemaining", true, () => {
				return hijackResponse(async (req, res) => {
					if (!res?.ok) return;
					const url = new URL(req.url);

					if (
						url.hostname === getRobloxUrl("catalog") &&
						(url.pathname === "/v1/catalog/items/details" ||
							url.pathname === "/v2/search/items/details")
					) {
						const data = (await res
							.clone()
							.json()) as MultigetAvatarItemsResponse<MarketplaceItemType>;
						if (data.data) {
							sendMessage("marketplace.sendItems", data.data);
						}
					}
				});
			}),
		);

		return () => {
			// @ts-expect-error: fine tbh
			Promise.all(checks).then((checks) => {
				for (const check of checks) check?.();
			});
		};
	},
} satisfies Page;

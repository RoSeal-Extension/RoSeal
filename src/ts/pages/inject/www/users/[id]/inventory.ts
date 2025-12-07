import { signal } from "@preact/signals";
import { getItemRestrictionsClassName } from "src/ts/components/marketplace/utils/items";
import type { ArchivedItemsItem } from "src/ts/constants/misc";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { watchOnce, watch } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest, hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type {
	ListUserInventoryAssetsDetailedResponse,
	ListUserInventoryCategoriesResponse,
	ListUserInventoryPlacesResponse,
	ListUserPrivateServersResponse,
} from "src/ts/helpers/requests/services/inventory";
import {
	type AvatarItemRequest,
	type MarketplaceItemType,
	multigetAvatarItems,
} from "src/ts/helpers/requests/services/marketplace";
import { handleArchivedItems } from "src/ts/specials/handleArchivedItems";
import { handleInventoryFavoritesCategories } from "src/ts/specials/handleInventoryFavoritesCategories";
import {
	type AssetsExplorerItemsScope,
	type AssetsExplorerScope,
	handleInventorySorting,
} from "src/ts/specials/handleInventorySorting";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getAvatarAssetLink, getAvatarBundleLink } from "src/ts/utils/links";
import { USER_INVENTORY_REGEX } from "src/ts/utils/regex";

type AssetsExplorerType = angular.IScope & {
	$ctrl: {
		staticData: {
			canViewInventory: boolean;
		};
		currentData: {
			categoryName: string;
		};
	};
};

export default {
	id: "user.inventory",
	regex: [USER_INVENTORY_REGEX],
	runInIframe: true,
	fn: ({ regexMatches }) => {
		const targetUserId = regexMatches?.[0]?.[2]
			? Number.parseInt(regexMatches?.[0]?.[2], 10)
			: undefined;

		addMessageListener("user.inventory.setupArchive", () => {
			const currentArchivedItems = signal<ArchivedItemsItem[]>([]);

			addMessageListener("user.inventory.setArchivedItems", (data) => {
				currentArchivedItems.value = data;
			});

			handleArchivedItems(currentArchivedItems);

			watchOnce("#inventory-container .page-content").then((pageContent) => {
				const scope = window.angular?.element(pageContent)?.scope<AssetsExplorerScope>();
				if (!scope) return;

				watch("#inventory-container .page-content .current-items", (el) => {
					const scope2 = window.angular?.element(el).scope<AssetsExplorerItemsScope>();
					if (!scope2) return;

					onSet(scope2.$ctrl, "currentData").then((currentData) => {
						let itemSection = currentData.itemSection;
						Object.defineProperty(currentData, "itemSection", {
							get: () => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return itemSection;

								return null;
							},
							set: (value) => {
								itemSection = value;
							},
						});

						hijackFunction(
							scope2.$ctrl,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return false;
							},
							"showMessageToFindNewItems",
						);
					});
				});

				let currentPageNumber = 1;
				let sortOrder = "Desc";
				let isBusy = false;

				const filterItems = () =>
					currentArchivedItems.value.filter(
						(item) => item.type !== "UserOutfit" && !item.bundleId,
					);

				const getItems = () => {
					const start = (currentPageNumber - 1) * 30;
					const end = currentPageNumber * 30;

					if (sortOrder === "Asc") {
						return filterItems().reverse().slice(start, end);
					}

					return filterItems().slice(start, end);
				};

				const getItemsData = () => {
					isBusy = true;

					const requests: AvatarItemRequest<MarketplaceItemType>[] = [];
					for (const item of getItems()) {
						requests.push({
							itemType: item.type as MarketplaceItemType,
							id: item.id,
						});
					}

					return multigetAvatarItems({
						items: requests,
					}).then((data) => {
						isBusy = false;

						const items = data.map((item) => {
							const iconClassName = getItemRestrictionsClassName(
								item.itemRestrictions,
							);

							return {
								Creator: {
									Id: item.creatorTargetId,
									Type: item.creatorType,
									Name: item.creatorName,
									nameForDisplay: item.creatorName,
								},
								Item: {
									AbsoluteUrl: `https://${getRobloxUrl("www")}${
										item.itemType === "Bundle"
											? getAvatarBundleLink(item.id, item.name)
											: getAvatarAssetLink(item.id, item.name)
									}`,
									Name: item.name,
								},
								bundleType: item.bundleType,
								creator: {
									id: item.creatorTargetId,
									name: item.creatorName,
									type: item.creatorType,
									hasVerifiedBadge: item.creatorHasVerifiedBadge,
								},
								Product: {
									IsFree: item.price === 0,
									PriceInRobux: item.lowestPrice ?? item.price,
								},
								id: item.id,
								itemType: item.itemType,
								itemV2: {
									id: item.id,
									type: item.itemType.toString(),
									thumbnail: {
										type:
											item.itemType === "Bundle"
												? "BundleThumbnail"
												: "Asset",
									},
								},
								priceStatus: item.priceStatus,
								itemRestrictionIcon: iconClassName,
								name: item.name,
							};
						});

						scope.$ctrl.assets = items;
						scope.$apply();

						return items;
					});
				};

				const hasNextPage = () => {
					const length = currentPageNumber * 30;

					return filterItems().at(length) !== undefined;
				};

				const hijackCursorPager = (paging: AssetsExplorerScope["$ctrl"]["cursorPager"]) => {
					if ("canReloadFirstPage" in paging) {
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return !isBusy;
							},
							"canLoadFirstPage",
						);
					}
					if ("canLoadFirstPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return !isBusy;
							},
							"canLoadFirstPage",
						);

					if ("canReloadCurrentPage" in paging) {
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return !isBusy;
							},
							"canReloadCurrentPage",
						);
					}

					if ("hasNextPage" in paging) {
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return hasNextPage();
							},
							"canLoadNextPage",
						);
					}

					if ("canLoadNextPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return !isBusy && hasNextPage();
							},
							"canLoadNextPage",
						);

					if ("canLoadPreviousPage" in paging) {
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return !isBusy && currentPageNumber >= 2;
							},
							"canLoadPreviousPage",
						);
					}

					if ("getCurrentPageNumber" in paging) {
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return currentPageNumber;
							},
							"getCurrentPageNumber",
						);
					}

					if ("getCurrentPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return getItemsData();
							},
							"getCurrentPage",
						);

					if ("reloadCurrentPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return getItemsData();
							},
							"reloadCurrentPage",
						);

					if ("loadNextPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								currentPageNumber++;
								return getItemsData();
							},
							"loadNextPage",
						);

					if ("loadFirstPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								currentPageNumber = 1;
								return getItemsData();
							},
							"loadFirstPage",
						);

					if ("loadPreviousPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								currentPageNumber--;
								if (currentPageNumber < 1) {
									currentPageNumber = 1;
								}
								return getItemsData();
							},
							"loadPreviousPage",
						);

					if ("getPagingParameters" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return {
									sortOrder,
								};
							},
							"getPagingParameters",
						);

					if ("setPagingParametersAndLoadFirstPage" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								currentPageNumber = 1;
								sortOrder = (args[0].sortOrder as string) ?? "Desc";

								featureValueIsInject("inventorySortFilters", true, () => {
									sendMessage("user.inventory.categoryChanged", {
										category: scope.$ctrl.currentData.category,
										subcategory: scope.$ctrl.currentData.subcategory,
										hasSortDirection: true,
										sortDirection: sortOrder,
										canView: true,
									});
								});

								return getItemsData();
							},
							"setPagingParametersAndLoadFirstPage",
						);

					if ("isBusy" in paging)
						hijackFunction(
							paging,
							(target, thisArg, args) => {
								if (scope.$ctrl.currentData.categoryName !== "archived")
									return target.apply(thisArg, args);

								return isBusy;
							},
							"isBusy",
						);
				};

				hijackCursorPager(scope.$ctrl.cursorPager);
				watchOnce("#inventory-container .pager-holder").then((pageHolder) => {
					// biome-ignore lint/suspicious/noExplicitAny: i just went through surgery i ain't dealing with this
					const paging = (window.angular.element(pageHolder)?.scope() as any)
						?.cursorPaging;
					if (!paging) return;

					hijackCursorPager(paging);
				});
			});
		});

		featureValueIsInject("inventorySortFilters", true, () =>
			watchOnce("#inventory-container .page-content").then((pageContent) => {
				const scope = window.angular?.element(pageContent)?.scope<AssetsExplorerScope>();
				if (!scope) return;

				handleInventorySorting(scope);
			}),
		);

		addMessageListener("user.inventory.setupCategories", (data) => {
			handleInventoryFavoritesCategories(data);
		});

		addMessageListener("user.inventory.addCategories", (categories) => {
			hijackResponse(async (req, res) => {
				if (!res) return;

				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("inventory") &&
					/^\/v1\/users\/\d+\/categories\/$/
				) {
					const data = (await res.clone().json()) as ListUserInventoryCategoriesResponse;
					data.categories.push(...categories);

					return new Response(JSON.stringify(data), res);
				}
			});
		});

		featureValueIsInject("viewUserSharedPrivateServers", true, () => {
			hijackRequest((req) => {
				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("games") &&
					url.pathname === "/v1/private-servers/my-private-servers" &&
					url.searchParams.get("privateServersTab") === "SharedPrivateServers"
				) {
					url.searchParams.set("privateServersTab", "OtherPrivateServers");
					url.searchParams.set("rosealPrivateServersTab", "SharedPrivateServers");
					if (!url.searchParams.get("cursor")) {
						url.searchParams.set("cursor", `1_${targetUserId}_0`);
					}

					return new Request(url.toString(), req);
				}
			});

			hijackResponse(async (req, res) => {
				if (!res?.ok) return;

				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("games") &&
					url.pathname === "/v1/private-servers/my-private-servers" &&
					url.searchParams.get("rosealPrivateServersTab") === "SharedPrivateServers"
				) {
					const data = (await res.json()) as ListUserPrivateServersResponse;
					let shouldEndCursor = false;
					for (let i = 0; i < data.data.length; i++) {
						const item = data.data[i];
						if (item.ownerId !== targetUserId) {
							data.data.splice(i, 1);
							shouldEndCursor = true;

							i--;
						}
					}

					if (shouldEndCursor) {
						data.nextPageCursor = null;
					}

					return new Response(JSON.stringify(data), res);
				}
			});

			watch(".assets-explorer-main-content", (explorer) => {
				const scope = window.angular.element(explorer)?.scope<AssetsExplorerType>();
				if (!scope) return;

				let canViewInventory = scope.$ctrl.staticData.canViewInventory;
				Object.defineProperty(scope.$ctrl.staticData, "canViewInventory", {
					get: () => {
						const isPrivateServersTab =
							scope.$ctrl.currentData.categoryName === "private-servers";

						sendMessage("user.inventory.canViewInventory", {
							canViewInventory,
							isPrivateServersTab,
						});

						return canViewInventory || isPrivateServersTab;
					},
					set: (value) => {
						canViewInventory = value;
					},
				});
			});
		});

		featureValueIsInject("inventoryHideFreePurchasedPlaces", true, () =>
			hijackResponse(async (req, res) => {
				if (!res) {
					return;
				}

				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("inventory")) {
					const match = url.pathname.match(/^\/v1\/users\/(\d+)\/places\/inventory$/);
					if (!match || url.searchParams.get("placesTab") !== "Purchased") {
						return;
					}

					const userIdStr = match[1];
					const data = (await res.clone().json()) as ListUserInventoryPlacesResponse;

					for (let i = data.data.length - 1; i >= 0; i--) {
						const item = data.data[i];
						if (
							!item.priceInRobux ||
							(item.creator.type === "User" &&
								item.creator.id.toString() === userIdStr)
						) {
							data.data.splice(i, 1);
						}
					}

					return new Response(JSON.stringify(data), res);
				}
			}),
		);
		featureValueIsInject("viewInventoryItemObtainedDate", true, () =>
			hijackResponse((req, res) => {
				if (!res) {
					return;
				}
				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("inventory")) {
					const match = url.pathname.match(/^\/v2\/users\/(\d+)\/inventory\/(\d+)$/);
					if (!match) {
						return;
					}

					const userId = Number.parseInt(match[1], 10);
					const assetTypeId = Number.parseInt(match[2], 10);

					res.clone()
						.json()
						.then((data) => {
							sendMessage("user.inventory.addAssets", {
								userId,
								assetTypeId,
								items: (data as ListUserInventoryAssetsDetailedResponse).data,
							});
						});
				}
			}),
		);
	},
} as Page;

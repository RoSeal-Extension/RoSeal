import { batch, effect, signal } from "@preact/signals";
import { differenceInDays } from "date-fns";
import { GENERIC_CHALLENGE_TYPE_HEADER } from "parse-roblox-errors";
import type { VNode } from "preact";
import {
	addMessageListener,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { getMessageInject } from "src/ts/helpers/domInvokes";
import { watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackComponent, hijackCreateElement } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { httpClient, type RESTError } from "src/ts/helpers/requests/main";
import { type Agent, getAssetById } from "src/ts/helpers/requests/services/assets";
import {
	type AvatarItem,
	type AvatarItemSaleLocationType,
	type AvatarItemSaleLocationTypeId,
	type Collectible,
	getAvatarItem,
	getCollectibleResaleData,
	multigetBundlesByIds,
	type MultigetCollectibleItemsByIdsRequest,
	purchaseCollectibleItem,
	type PurchaseCollectibleItemResponse,
	purchaseItem,
	type PurchaseItemResponse,
	type ResaleDataPoint,
} from "src/ts/helpers/requests/services/marketplace";
import type { AvatarItemFeedback } from "src/ts/pages/main/www/items/[id]/[name]";
import { calculateRecentAveragePriceAfterSale } from "src/ts/utils/assets";
import { getAuthenticatedUserSync } from "src/ts/utils/authenticatedUser";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getAvatarAssetLink, getAvatarBundleLink } from "src/ts/utils/links";
import { AVATAR_ITEM_REGEX } from "src/ts/utils/regex";
import { getRobloxI18nNamespace } from "src/ts/utils/robloxI18n";

const reactContainerIds = [
	"item-thumbnail-container-frontend",
	"item-info-container-frontend",
	"favorites-button",
	"sponsored-catalog-items",
	"item-list-container-recommendations",
] as const;

export type CachedCollectibleData = {
	price: number | null;
	remaining: number | null;
	id: string;
	creatorId: number;
	creatorType: "User" | "Group";
	creatorName: string;
	name: string;
	description: string;
	quantity?: number | null;
	collectibleProductId?: string | null;
	quantityLimitPerUser?: number;
	saleLocationType?: AvatarItemSaleLocationType;
	saleLocationTypeId?: AvatarItemSaleLocationTypeId;
};

export type CachedItemData = {
	productId?: number;
	sellerId?: number;
	price?: number | null;
	remaining?: number | null;
};

export const TESTING_REFRESH = false;

export default {
	id: "item.details",
	regex: [AVATAR_ITEM_REGEX],
	hotSwappable: true,
	fn: async ({ regexMatches }) => {
		const checks: MaybeDeepPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];

		const itemType = signal<"Bundle" | "Asset">(
			regexMatches![0]![1]!.toLowerCase() === "bundles" ? "Bundle" : "Asset",
		);
		const itemId = signal(Number.parseInt(regexMatches![0]![2], 10));

		const list = {} as Record<(typeof reactContainerIds)[number], [VNode, Element]>;

		checks.push(
			featureValueIsInject("viewAvatarItemResellerMoreInfo", true, () =>
				watch("#resellers .reseller-item", (el) => {
					const scope = window.angular.element(el)?.scope<
						angular.IScope & {
							resaleRecord: {
								collectibleItemInstanceId: string;
								price: number;
							};
						}
					>();

					el.setAttribute(
						"data-instance-id",
						scope.resaleRecord.collectibleItemInstanceId,
					);
				}),
			),
		);

		checks.push(
			featureValueIsInject("viewAvatarItemRAPAfterPurchase", true, () => {
				let recentAveragePrice: number | undefined;

				checks.push(
					effect(() => {
						getAvatarItem({
							itemType: itemType.value,
							itemId: itemId.value,
						}).then(async (data) => {
							if (data?.collectibleItemId) {
								recentAveragePrice = (
									await getCollectibleResaleData({
										collectibleItemId: data.collectibleItemId,
									})
								).recentAveragePrice;
							}
						});
					}),
				);

				return watch("#resellers .reseller-price-container", async (priceContainer) => {
					const scope = window.angular.element(priceContainer)?.scope<
						angular.IScope & {
							resaleRecord: {
								price: number;
							};
						}
					>();

					if (!scope || !recentAveragePrice) return;

					if (!recentAveragePrice) return;

					priceContainer.setAttribute(
						"title",
						await getMessageInject("avatarItem.resellers.item.price.rapChange", {
							robux: calculateRecentAveragePriceAfterSale(
								recentAveragePrice,
								scope.resaleRecord.price,
							),
						}),
					);
				});
			}),
		);

		checks.push(
			featureValueIsInject("viewHiddenAvatarItems", true, () =>
				hijackResponse((req, res) => {
					if (!res) {
						return;
					}
					const url = new URL(req.url);
					if (url.hostname === getRobloxUrl("catalog")) {
						const match = url.pathname.match(/^\/v1\/catalog\/items\/(\d+)\/details$/);
						if (match && res.status === 404) {
							const setItemType =
								url.searchParams.get("itemType")?.toLowerCase() === "asset"
									? "Asset"
									: "Bundle";
							const setItemId = Number.parseInt(match[1], 10);
							if (setItemType !== itemType.value || itemId.value !== setItemId) {
								return new Promise(() => {});
							}
							location.href =
								setItemType === "Asset"
									? getAvatarAssetLink(setItemId, undefined, true)
									: getAvatarBundleLink(setItemId, undefined, true);
							return new Promise(() => {});
						}
					}
				}),
			),
		);

		featureValueIsInject("avatarItemMorePriceChartData", true, () => {
			watchOnce(".price-volume-charts-container").then((container) => {
				const scope = window.angular.element(container)?.scope<
					angular.IScope & {
						$ctrl: {
							resaleChartDayOptions: number[];
							resaleData: {
								priceDataPoints: ResaleDataPoint[];
							};
						};
					}
				>();

				if (!scope) {
					return;
				}

				const latestDate = scope.$ctrl.resaleData.priceDataPoints.at(-1)?.date;
				if (!latestDate) {
					return;
				}

				const lastOptionDays = differenceInDays(new Date(), latestDate);
				if (lastOptionDays < scope.$ctrl.resaleChartDayOptions.at(-1)!) {
					return;
				}

				if (lastOptionDays > 365) {
					scope.$ctrl.resaleChartDayOptions.push(365);
				}

				scope.$ctrl.resaleChartDayOptions.push(lastOptionDays);
			});

			onSet(window, "jQuery").then((jq) => {
				onSet(jq.fn, "highcharts").then(() => {
					hijackFunction(
						jq.fn,
						(target, thisArg, args) => {
							const result = target.apply(thisArg, args);

							if ("xAxis" in result) {
								const xAxis = result.xAxis[0];
								if (xAxis.userOptions.labels.format) {
									hijackFunction(
										xAxis,
										(target, thisArg, args) => {
											// biome-ignore lint/suspicious/noExplicitAny: fine
											const arg = args[0] as any;
											const min = arg.min;
											if (min) {
												const diff = differenceInDays(new Date(), min);
												if (diff >= 365) {
													arg.labels = {
														format: "{value:%m/%d/%y}",
													};
												} else {
													arg.labels = {
														format: "{value:%m/%d}",
													};
												}
											}

											return target.apply(thisArg, args);
										},
										"update",
									);
								}
							}
							return result;
						},
						"highcharts",
					);
				});
			});
		});

		checks.push(
			featureValueIsInject("fix3DTryOn2DItems", true, () =>
				hijackCreateElement(
					(_, props) => {
						return Boolean(props && typeof props === "object" && "showMode3D" in props);
					},
					(_, __, props) => {
						const propsType = props as unknown as {
							showMode3D: boolean;
							mode3DEnabled: boolean;
							isAnimation: boolean;
							tryOnEnabled: boolean;
							onTryOnButtonClick: (fromEnabled: boolean) => void;
							onModeButtonClick: (from3D: boolean) => void;
						};

						const otherwiseEnabled = propsType.showMode3D;
						if (!otherwiseEnabled)
							propsType.showMode3D = !propsType.isAnimation && propsType.tryOnEnabled;

						hijackFunction(
							propsType,
							(target, thisArg, args) => {
								if (!otherwiseEnabled && propsType.mode3DEnabled) {
									propsType.onModeButtonClick(true);
								}

								return target.apply(thisArg, args);
							},
							"onTryOnButtonClick",
						);
					},
				),
			),
		);

		checks.push(
			setInvokeListener(
				"avatarItem.changeItem",
				({ itemId: newItemId, itemType: newItemType }) => {
					batch(() => {
						itemType.value = newItemType;
						itemId.value = newItemId;
					});
				},
			),
		);

		const refreshDetails = () => {
			const frontend = list["item-info-container-frontend"];
			if (!frontend) {
				return;
			}
			window.ReactDOM.unmountComponentAtNode(frontend[1]);
			window.ReactDOM.render(...frontend);
		};
		checks.push(addMessageListener("avatarItem.refreshDetails", refreshDetails));

		checks.push(
			hijackComponent(
				(_, container) =>
					reactContainerIds.includes(container.id as (typeof reactContainerIds)[number]),
				(element, container) => {
					list[container.id as (typeof reactContainerIds)[number]] = [element, container];
				},
			),
		);

		checks.push(
			featureValueIsInject("avatarItemQuickFreePurchase", true, async () => {
				const handleFeedback = (data: AvatarItemFeedback) =>
					sendMessage("avatarItem.showSystemFeedback", data);

				const cachedPartialCollectibles: Record<string, CachedCollectibleData> = {};
				const cachedItems: Record<string, CachedItemData> = {};
				const cachedCollectibles: Record<
					string,
					Collectible & {
						saleLocationTypeId?: AvatarItemSaleLocationTypeId;
					}
				> = {};

				const fetchForCache = () => {
					const key = `${itemType.value}${itemId.value}`;
					if (itemType.value === "Asset") {
						getAssetById({ assetId: itemId.value, overrideCache: true }).then(
							(data) => {
								if (TESTING_REFRESH) {
									data.priceInRobux = 0;
								}

								cachedItems[key] = {
									sellerId: data.creator.id,
									price: data.isPublicDomain ? 0 : data.priceInRobux,
									productId: data.productId!,
									remaining: data.remaining,
								};

								if (data.collectibleItemId) {
									const cachedPartialCollectible = cachedPartialCollectibles[key];

									cachedPartialCollectibles[key] = {
										...cachedPartialCollectible,
										price: data.priceInRobux,
										remaining: data.remaining,
										id: data.collectibleItemId,
										name: data.name,
										description: data.description || "",
										creatorId: data.creator.creatorTargetId,
										creatorType: data.creator.creatorType!,
										creatorName: data.creator.name!,
										collectibleProductId: data.collectibleProductId,
										quantityLimitPerUser:
											cachedPartialCollectible?.quantityLimitPerUser ?? 0,
										saleLocationType:
											cachedPartialCollectible?.saleLocationType ??
											"ShopAndAllExperiences",
										saleLocationTypeId: data.saleLocation?.saleLocationType,
									};

									const cachedCollectible =
										cachedCollectibles[data.collectibleItemId];
									cachedCollectibles[data.collectibleItemId] = {
										...cachedCollectible,
										collectibleItemId: data.collectibleItemId,
										collectibleProductId: data.collectibleProductId!,
										price: data.priceInRobux ?? -1,
										name: data.name,
										description: data.description || "",
										itemTargetId: data.assetId,
										creatorId: data.creator.creatorTargetId,
										creatorType: data.creator.creatorType!,
										creatorName: data.creator.name!,
										creatorHasVerifiedBadge: data.creator.hasVerifiedBadge,
										unitsAvailableForConsumption: data.remaining || 0,
										assetStock:
											cachedCollectible?.assetStock ||
											cachedPartialCollectible?.quantity ||
											0,
										lowestPrice:
											data.collectiblesItemDetails
												?.collectibleLowestResalePrice ??
											data.priceInRobux ??
											-1,
										itemRestrictions: null,
										errorCode: null,
										quantityLimitPerUser:
											cachedCollectible?.quantityLimitPerUser ??
											cachedPartialCollectible?.quantityLimitPerUser ??
											0,
										saleLocationType:
											cachedCollectible?.saleLocationType ??
											cachedPartialCollectible?.saleLocationType ??
											"ShopAndAllExperiences",
										saleLocationTypeId:
											cachedCollectible?.saleLocationTypeId ??
											cachedPartialCollectible?.saleLocationTypeId ??
											1,
										itemTargetType: cachedCollectible?.itemTargetType ?? 1,
										itemType: cachedCollectible?.itemType ?? 1,
										lowestAvailableResaleProductId:
											data.collectiblesItemDetails
												?.collectibleLowestAvailableResaleProductId ?? null,
										lowestAvailableResaleItemInstanceId:
											data.collectiblesItemDetails
												?.collectibleLowestAvailableResaleItemInstanceId ??
											null,
										resaleRestriction:
											cachedCollectible?.resaleRestriction ?? 1,
										productSaleStatus:
											cachedCollectible?.productSaleStatus ?? 1,
										productTargetId: cachedCollectible?.productTargetId ?? 1,
									};
								}
							},
						);
					} else {
						multigetBundlesByIds({
							bundleIds: [itemId.value],
							overrideCache: true,
						})
							.then((items) => {
								const data = items[0];
								if (!data) return;

								if (TESTING_REFRESH && data.product) {
									data.product.isFree = true;
									data.product.isForSale = true;
									data.product.isPublicDomain = true;
									data.product.priceInRobux = 0;
								}

								cachedItems[key] = {
									sellerId: data.creator.id,
									price: data.product?.priceInRobux,
									productId: data.product?.id,
								};

								if (data.collectibleItemDetail) {
									const cachedPartialCollectible = cachedPartialCollectibles[key];

									cachedPartialCollectibles[key] = {
										...cachedPartialCollectible,
										price: data.collectibleItemDetail.price,
										remaining: data.collectibleItemDetail.unitsAvailable,
										id: data.collectibleItemDetail.collectibleItemId,
										name: data.name,
										description: data.description || "",
										creatorId: data.creator.id,
										creatorType: "User",
										creatorName: data.creator.name,
										collectibleProductId:
											data.collectibleItemDetail.collectibleProductId,
										quantityLimitPerUser:
											data.collectibleItemDetail.quantityLimitPerUser ?? 0,
										saleLocationType:
											data.collectibleItemDetail.saleLocation
												.saleLocationType,
										saleLocationTypeId:
											data.collectibleItemDetail.saleLocation
												.saleLocationTypeId,
									};

									const cachedCollectible =
										cachedCollectibles[
											data.collectibleItemDetail.collectibleItemId
										];
									cachedCollectibles[
										data.collectibleItemDetail.collectibleItemId
									] = {
										...cachedCollectible,
										collectibleItemId:
											data.collectibleItemDetail.collectibleItemId,
										collectibleProductId:
											data.collectibleItemDetail.collectibleProductId,
										price: data.collectibleItemDetail.price,
										name: data.name,
										description: data.description || "",
										itemTargetId: data.id,
										creatorId: data.creator.id,
										creatorType: "User",
										creatorName: data.creator.name,
										creatorHasVerifiedBadge: data.creator.hasVerifiedBadge,
										unitsAvailableForConsumption:
											data.collectibleItemDetail.unitsAvailable || 0,
										assetStock: data.collectibleItemDetail.totalQuantity,
										lowestPrice: data.collectibleItemDetail.lowestPrice,
										itemRestrictions: null,
										errorCode: null,
										quantityLimitPerUser:
											data.collectibleItemDetail.quantityLimitPerUser ?? 0,
										saleLocationType:
											data.collectibleItemDetail.saleLocation
												.saleLocationType,
										saleLocationTypeId:
											data.collectibleItemDetail.saleLocation
												.saleLocationTypeId,
										itemTargetType: cachedCollectible?.itemTargetType ?? 2,
										itemType: cachedCollectible?.itemType ?? 2,
										lowestAvailableResaleProductId:
											data.collectibleItemDetail
												.lowestAvailableResaleProductId,
										lowestAvailableResaleItemInstanceId:
											data.collectibleItemDetail
												.lowestAvailableResaleItemInstanceId,
										resaleRestriction:
											cachedCollectible?.resaleRestriction ?? 1,
										productSaleStatus:
											cachedCollectible?.productSaleStatus ?? 1,
										productTargetId: data.product?.id ?? 0,
									};
								}
							})
							.catch(() => {});
					}
				};

				fetchForCache();
				checks.push(
					hijackResponse(async (req, res) => {
						if (!res) {
							return;
						}

						const url = new URL(req.url);
						if (url.hostname === getRobloxUrl("catalog")) {
							if (/^\/v1\/catalog\/items\/(\d+)\/details$/.test(url.pathname)) {
								if (res.status === 429) {
									handleFeedback({
										type: "Load",
										status: 429,
									});
								} else if (res.status === 200) {
									const data = (await res.clone().json()) as AvatarItem<"Bundle">;
									if (TESTING_REFRESH) {
										data.price = 0;
									}

									cachedItems[data.id] = {
										price: data.price,
										sellerId: data.expectedSellerId || data.creatorTargetId,
										productId: data.productId,
										remaining: data.unitsAvailableForConsumption,
									};

									const key = `${data.itemType}${data.id}`;
									if (data.collectibleItemId) {
										const cachedPartialCollectible =
											cachedPartialCollectibles[key];

										cachedPartialCollectibles[key] = {
											...cachedPartialCollectible,
											price: data.price,
											remaining: data.unitsAvailableForConsumption,
											id: data.collectibleItemId,
											creatorId: data.creatorTargetId,
											creatorType: data.creatorType,
											creatorName: data.creatorName,
											name: data.name,
											description: data.description,
											quantity: data.totalQuantity,
											saleLocationType: data.saleLocationType,
										};

										if (cachedPartialCollectible?.collectibleProductId) {
											const cachedCollectible =
												cachedCollectibles[data.collectibleItemId];

											cachedCollectibles[data.collectibleItemId] = {
												...cachedCollectible,
												collectibleItemId: data.collectibleItemId,
												price: data.price,
												creatorId: data.creatorTargetId,
												creatorType: data.creatorType,
												creatorName: data.creatorName,
												creatorHasVerifiedBadge:
													data.creatorHasVerifiedBadge,
												itemTargetId: data.id,
												lowestPrice: data.price ?? -1,
												name: data.name,
												description: data.description,
												unitsAvailableForConsumption:
													data.unitsAvailableForConsumption,
												assetStock: data.totalQuantity,
												errorCode: null,
												itemRestrictions: null,
												quantityLimitPerUser: data.quantityLimitPerUser,
												saleLocationType: data.saleLocationType,
											};
										}
									}

									if (cachedPartialCollectibles[key] && !data.collectibleItemId) {
										const cachedPartialCollectible =
											cachedPartialCollectibles[key];
										data.collectibleItemId = cachedPartialCollectible.id;
										if (!Number.isInteger(data.price)) {
											data.price = cachedPartialCollectible.price!;
										}

										if (!Number.isInteger(data.unitsAvailableForConsumption)) {
											data.unitsAvailableForConsumption =
												cachedPartialCollectible.remaining!;
										}

										if (
											!data.totalQuantity &&
											cachedPartialCollectible.quantity
										) {
											data.totalQuantity = cachedPartialCollectible.quantity;
										}

										if (
											!data.itemRestrictions?.includes("Collectible") &&
											cachedPartialCollectible.quantity
										) {
											data.itemRestrictions ??= [];
											data.itemRestrictions.push("Collectible");
										}
									}

									return new Response(JSON.stringify(data), res);
								}
							}
						} else if (url.hostname === getRobloxUrl("economy")) {
							if (/^\/v1\/purchases\/products\/.+?$/.test(url.pathname)) {
								if (res?.headers.has(GENERIC_CHALLENGE_TYPE_HEADER)) {
									return;
								}

								if (res.status === 429) {
									handleFeedback({
										type: "Load",
										status: 429,
									});
								} else {
									const data = (await res
										.clone()
										.json()
										.catch(() => {})) as PurchaseItemResponse | undefined;

									if (data?.reason !== "AlreadyOwned") {
										handleFeedback({
											type: "GenericPurchase",
											divType: data?.showDivId,
											reason: data?.title,
											realReason: data?.reason ?? "ApplicationError",
											purchased: data?.purchased ?? false,
											status: res.status,
										});
									}
								}
							}
						} else if (url.hostname === getRobloxUrl("apis")) {
							if (
								/^\/marketplace-sales\/v1\/item\/.+?\/purchase-item$/.test(
									url.pathname,
								)
							) {
								if (res.status === 401 || res.status === 403) {
									return;
								}

								if (res.status === 429) {
									handleFeedback({
										type: "Load",
										status: res.status,
									});
								} else {
									const data = (await res
										.clone()
										.json()
										.catch(() => {})) as
										| PurchaseCollectibleItemResponse
										| undefined;

									handleFeedback({
										type: "GenericPurchase",
										reason: data?.purchaseResult,
										realReason: data?.errorMessage,
										purchased: data?.purchased ?? false,
										status: res.status,
									});
								}
							} else if (
								/^\/marketplace-sales\/v1\/item\/.+?\/resellers$/.test(
									url.pathname,
								) &&
								res.status !== 200
							) {
								return new Response(
									JSON.stringify({
										data: [],
									}),
									{
										status: 200,
										headers: {
											"content-type": "application/json",
										},
									},
								);
							} else if (
								/^\/marketplace-items\/v1\/items\/details/.test(url.pathname)
							) {
								if (res.status === 200) {
									const data = (await res
										.clone()
										.json()
										.catch(() => [])) as Collectible[];

									for (const [index, item] of data.entries()) {
										if (item.errorCode || !item.collectibleProductId) {
											if (cachedCollectibles[item.collectibleItemId]) {
												data[index] =
													cachedCollectibles[item.collectibleItemId];
											}
										} else {
											if (TESTING_REFRESH) {
												item.price = 0;
											}

											const previousValue =
												cachedCollectibles[item.collectibleItemId];
											if (
												previousValue?.unitsAvailableForConsumption &&
												!item.unitsAvailableForConsumption
											) {
												item.unitsAvailableForConsumption =
													previousValue.unitsAvailableForConsumption;
											}

											if (item.itemTargetId) {
												cachedPartialCollectibles[item.itemTargetId] = {
													price: item.price,
													id: item.collectibleItemId,
													creatorId: item.creatorId,
													creatorType: item.creatorType,
													creatorName: item.creatorName,
													name: item.name,
													description: item.name,
													remaining: item.unitsAvailableForConsumption,
													quantity: item.assetStock,
													collectibleProductId: item.collectibleProductId,
													saleLocationType: item.saleLocationType,
													saleLocationTypeId:
														previousValue?.saleLocationTypeId,
												};
											}

											cachedCollectibles[item.collectibleItemId] = {
												...item,
												saleLocationTypeId:
													previousValue?.saleLocationTypeId,
											};
										}
									}

									return new Response(JSON.stringify(data), res);
								}
								if (!req.body) {
									return;
								}

								const itemIds = (
									(await req
										.clone()
										.json()) as MultigetCollectibleItemsByIdsRequest
								).itemIds;
								return new Response(
									JSON.stringify({
										data: itemIds.map((id) =>
											cachedPartialCollectibles[id]
												? cachedPartialCollectibles[id]
												: {
														collectibleItemId: id,
														errorCode: 5,
													},
										),
									}),
									{
										headers: {
											"content-type": "application/json",
										},
										status: 200,
									},
								);
							}
						}

						return;
					}),
				);

				checks.push(itemId.subscribe(fetchForCache));
				httpClient.getCsrfToken(true);

				const buyMessage = (await getRobloxI18nNamespace("Feature.Catalog"))?.[
					"Action.Buy"
				];

				hijackCreateElement(
					(_, props) =>
						props !== null &&
						"itemPurchaseParams" in props &&
						!!props.itemPurchaseParams &&
						// @ts-expect-error: trust me
						!props.collectibleItemInstanceId &&
						// @ts-expect-error: trust me
						props.itemPurchaseParams.expectedPrice === 0,
					(createElement, _, props) => {
						// @ts-expect-error: blah blah
						const params = props.itemPurchaseParams as {
							assetName: string;
							assetType: string;
							collectibleItemId?: string | null;
							collectibleItemInstanceId?: string | null;
							collectibleProductId?: string | null;
							expectedCurrency: 1;
							expectedPrice: 0;
							expectedSellerId: number;
							isLimited: boolean;
							isPlace: boolean;
							productId: number;
							sellerName: string;
							sellerType: Agent;
							userAssetId: number | null;
						};

						const authenticatedUser = getAuthenticatedUserSync();
						if (!authenticatedUser) return;

						return createElement(
							"div",
							{
								className: "shopping-cart-buy-button item-purchase-btns-container",
							},
							createElement(
								"div",
								{
									className: "btn-container",
								},
								createElement(
									"button",
									{
										type: "button",
										className:
											"shopping-cart-buy-button btn-growth-lg PurchaseButton",
										onClick: () => {
											handleFeedback({
												type: "Load",
												loading: true,
											});

											refreshDetails();
											if (
												params.collectibleItemId &&
												params.collectibleProductId
											) {
												purchaseCollectibleItem({
													collectibleItemId: params.collectibleItemId,
													expectedCurrency: 1,
													expectedPrice: 0,
													expectedPurchaserId:
														authenticatedUser.userId.toString(),
													expectedPurchaserType: "User",
													expectedSellerId: params.expectedSellerId,
													expectedSellerType: params.sellerType,
													idempotencyKey: crypto.randomUUID(),
													collectibleProductId:
														params.collectibleProductId,
												})
													.then((data) => {
														handleFeedback({
															type: "GenericPurchase",
															reason: data.purchaseResult,
															realReason: data.errorMessage,
															purchased: data.purchased,
															status: 200,
														});
													})
													.catch((error: RESTError) => {
														if (error.httpCode === 429) {
															handleFeedback({
																type: "Load",
																status: error.httpCode,
															});
														} else {
															handleFeedback({
																type: "GenericPurchase",
																purchased: false,
																reason: error.errors?.[0]?.message,
																status: error.httpCode,
															});
														}
													});
											} else {
												purchaseItem({
													productId: params.productId,
													expectedCurrency: 1,
													expectedPrice: 0,
													expectedSellerId: params.expectedSellerId,
												})
													.then((data) => {
														if (data.reason !== "AlreadyOwned") {
															handleFeedback({
																type: "GenericPurchase",
																divType: data.showDivId,
																reason: data.title,
																realReason: data.reason,
																purchased: data.purchased ?? false,
																status: 0,
															});
														}
													})
													.catch((error: RESTError) => {
														if (error.httpCode === 429) {
															handleFeedback({
																type: "Load",
																status: error.httpCode,
															});
														} else {
															handleFeedback({
																type: "GenericPurchase",
																purchased: false,
																reason: error.errors?.[0]?.message,
																status: error.httpCode,
															});
														}
													});
											}
										},
									},
									buyMessage,
								),
							),
						);
					},
				);
			}),
		);
	},
} satisfies Page;

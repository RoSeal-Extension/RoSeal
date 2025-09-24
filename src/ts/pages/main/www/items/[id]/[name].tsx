import { batch, signal } from "@preact/signals";
import { type ContainerNode, Fragment, render } from "preact";
import { useMemo } from "preact/hooks";
import AddToProfileButton from "src/ts/components/avatarItem/AddToProfileButton";
import ArchiveInInventoryButton from "src/ts/components/avatarItem/ArchiveInInventoryButton";
import BundleRecolorableField from "src/ts/components/avatarItem/BundleRecolorable";
import DynamicFloorTooltip from "src/ts/components/avatarItem/DynamicFloorTooltip";
import ItemBundles from "src/ts/components/avatarItem/ItemBundles";
import AvatarItemOwnedPopover from "src/ts/components/avatarItem/ItemOwnedPopover";
import ItemTags from "src/ts/components/avatarItem/ItemTags";
import AddToAvatarListButton from "src/ts/components/avatarItem/lists/AddToListButton";
import PriceInfo from "src/ts/components/avatarItem/PriceInfo";
import AvatarItemResellerOwned from "src/ts/components/avatarItem/resellers/ItemOwned";
import ItemSales from "src/ts/components/avatarItem/Sales";
import SaleTimer from "src/ts/components/avatarItem/SaleTimer";
import SearchByCreatorButton from "src/ts/components/avatarItem/SearchByCreatorButton";
import AvatarItemTabs from "src/ts/components/avatarItem/Tabs";
import WearItemButton from "src/ts/components/avatarItem/WearItemButton";
import Button from "src/ts/components/core/Button";
import Icon from "src/ts/components/core/Icon";
import RobuxView from "src/ts/components/core/RobuxView";
import {
	loading,
	success,
	warning,
} from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";
import Tooltip from "src/ts/components/core/Tooltip";
import usePromise from "src/ts/components/hooks/usePromise";
import BlockItemButton from "src/ts/components/item/BlockItemButton";
import ItemConnectionsOwned from "src/ts/components/item/ConnectionsOwned";
import ItemFavoritedSince from "src/ts/components/item/FavoritedSince";
import InExperienceOnlyUniversesField from "src/ts/components/item/InExperienceOnlyUniversesField";
import ItemBlockedScreen from "src/ts/components/item/ItemBlockedScreen";
import ItemProductInfo from "src/ts/components/item/ProductInfo";
import ItemUpdatedCreated from "src/ts/components/item/UpdatedCreated";
import CopyShareLinkButton from "src/ts/components/misc/CopyShareLinkButton";
import { getFormattedDuration } from "src/ts/components/utils/getFormattedDuration";
import {
	allowedFastPurchaseReasons,
	allowedFastPurchaseTypeDivs,
	WEB_PURCHASABLE_SALE_LOCATIONS,
} from "src/ts/constants/itemPage";
import { ROBLOX_USERS } from "src/ts/constants/robloxUsers";
import { addMessageListener, invokeMessage, sendMessage } from "src/ts/helpers/communication/dom";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { hideEl, watch, watchAttributes, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs, multigetFeaturesValues } from "src/ts/helpers/features/helpers";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { OpenCloudInventoryItem } from "src/ts/helpers/requests/services/inventory";
import {
	getAvatarItem,
	type MarketplaceItemType,
	multigetCollectibleItemsByIds,
} from "src/ts/helpers/requests/services/marketplace";
import { getCanTradeWithUser } from "src/ts/helpers/requests/services/trades";
import { listAllUserInventoryItemInstances } from "src/ts/utils/assets";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { renderMentions } from "src/ts/utils/description";
import { getAssetTypeData, getBundleTypeData } from "src/ts/utils/itemTypes";
import { getUserTradeLink } from "src/ts/utils/links";
import { sleep } from "src/ts/utils/misc";
import { AVATAR_ITEM_REGEX } from "src/ts/utils/regex";
import {
	renderAfter,
	renderAppend,
	renderAsContainer,
	renderBefore,
	renderPrepend,
} from "src/ts/utils/render";
import { getPathFromMaybeUrl } from "src/ts/utils/url";

export type AvatarItemFeedback = {
	type: string;
	divType?: string;
	realReason?: string;
	reason?: string;
	purchased?: boolean;
	status?: number;
	loading?: boolean;
};

export default {
	id: "item.details",
	regex: [AVATAR_ITEM_REGEX],
	css: ["css/item.css"],
	hotSwappable: true,
	fn: async ({ regexMatches }) => {
		const checks: MaybeDeepPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];

		const pageType = signal(regexMatches![0]![1]!.toLowerCase() as "catalog" | "bundles");
		const itemType = signal<MarketplaceItemType>(
			pageType.value === "bundles" ? "Bundle" : "Asset",
		);
		const itemId = signal(Number.parseInt(regexMatches![0]![2], 10));

		checks.push(
			featureValueIs("viewAvatarItemHeldPeriod", true, () =>
				watch("#item-details-limited-inventory-container", async (_, kill) => {
					kill?.();
					const authenticatedUser = await getAuthenticatedUser();
					if (!authenticatedUser) return;

					const data = await listAllUserInventoryItemInstances(
						authenticatedUser.userId,
						authenticatedUser.userId,
						authenticatedUser.isUnder13,
						itemType.value,
						itemId.value,
					);
					if (!data) return;

					checks.push(
						watch(
							".item-details-limited-inventory .item-details-limited-inventory-row",
							(row) => {
								const parent = row.parentElement;
								if (!parent) return;

								let index = -1;

								const items = parent.querySelectorAll(
									".item-details-limited-inventory-row",
								);
								for (let i = 0; i < items.length; i++) {
									if (row === items[i]) {
										index = i;
										break;
									}
								}

								if (index === -1) return;

								const item = data[index];
								if (
									(item.assetDetails?.collectibleDetails &&
										item.assetDetails.collectibleDetails.instanceState !==
											"HOLD") ||
									!item.addTime
								) {
									return;
								}

								const holdText = row.querySelector("#holding .btn-buy-md");
								if (holdText) {
									holdText.textContent = getMessage(
										"avatarItem.holdingItems.item.heldFor",
										{
											time: getFormattedDuration(
												new Date(item.addTime),
												new Date(),
											),
										},
									);
								}
							},
						),
					);
				}),
			),
		);

		checks.push(
			featureValueIs("viewInventoryItemObtainedDate", true, () =>
				watch(
					".item-details-info-header .item-owned:not(.roseal-item-owned)",
					(ownedBtn) => {
						ownedBtn.classList.add("roseal-item-owned");
						ownedBtn.addEventListener("click", (e) => {
							if (
								!e.isTrusted ||
								(e.target as HTMLElement).classList.contains("menu-open-btn")
							)
								return;

							e.stopImmediatePropagation();
							ownedBtn.querySelector<HTMLDivElement>(".menu-open-btn")?.click();
						});

						renderAppend(
							<AvatarItemOwnedPopover
								itemType={itemType.value}
								itemId={itemId.value}
							/>,
							ownedBtn,
						);
					},
				),
			),
		);

		checks.push(
			featureValueIs("viewAvatarItemResellerMoreInfo", true, () =>
				getAuthenticatedUser().then((authenticatedUser) => {
					if (!authenticatedUser) return;

					return watch("#resellers thumbnail-2d > span", async (thumbnail2d) => {
						const userIdStr = thumbnail2d.getAttribute("thumbnail-target-id");
						if (!userIdStr) return;

						// wait until inject handles it
						await sleep(100);

						const resellerItem = thumbnail2d.closest(".reseller-item");
						if (!resellerItem) return;

						if (resellerItem.hasAttribute("data-handled-owned")) return;
						resellerItem.setAttribute("data-handled-owned", "");

						const instanceId = resellerItem.getAttribute("data-instance-id");
						if (!instanceId) return;

						const serialNumberEl = resellerItem.querySelector<HTMLSpanElement>(
							".serial-number:not(.ng-hide)",
						);

						const resellerButtonsEl = resellerItem.querySelector<HTMLDivElement>(
							".reseller-buttons-container",
						);
						if (!resellerButtonsEl || !serialNumberEl) return;

						const userId = Number.parseInt(userIdStr, 10);

						if (authenticatedUser.hasPremium) {
							getCanTradeWithUser({
								userId,
							})
								.catch(() => ({
									canTrade: false,
								}))
								.then((data) => {
									renderPrepend(
										<Button
											as="a"
											href={getUserTradeLink(userId, instanceId)}
											type="buy"
											className="reseller-purchase-button reseller-offer-btn"
											disabled={!data.canTrade}
										>
											{getMessage("avatarItem.resellers.item.offer")}
										</Button>,
										resellerButtonsEl,
									);
								});
						}

						if (itemType.value !== "Asset") return;

						const isUGCPromise = getAvatarItem({
							itemType: itemType.value,
							itemId: itemId.value,
						}).then((data) => {
							return (
								data?.creatorType !== "User" ||
								data.creatorTargetId !== ROBLOX_USERS.robloxSystem
							);
						});
						listAllUserInventoryItemInstances(
							authenticatedUser.userId,
							userId,
							false,
							itemType.value,
							itemId.value,
						).then(async (instances) => {
							if (!instances) return;
							let instance: OpenCloudInventoryItem | undefined;

							for (const item of instances) {
								if (
									item.assetDetails?.collectibleDetails?.instanceId === instanceId
								) {
									instance = item;
								}
							}

							renderAfter(
								<AvatarItemResellerOwned
									isLimited
									isUGC={await isUGCPromise}
									item={
										instance && {
											addTime: instance.addTime,
											userAssetId:
												instance.assetDetails?.instanceId !== undefined
													? Number.parseInt(
															instance.assetDetails.instanceId,
															10,
														)
													: undefined,
										}
									}
								/>,
								serialNumberEl,
							);
						});
					});
				}),
			),
		);

		checks.push(
			featureValueIs("avatarItemLists", true, () =>
				watch("#favorites-button", (el) => {
					if (el.hasAttribute("data-has-rendered-lists")) return;

					el.setAttribute("data-has-rendered-lists", "");
					renderAfter(
						() =>
							itemType.value === "Asset" && (
								<AddToAvatarListButton
									itemId={itemId.value}
									itemType={itemType.value}
								/>
							),
						el,
					);
				}),
			),
		);

		checks.push(
			featureValueIs("viewAvatarItemConnectionsOwned", true, () =>
				watch(".item-details-thumbnail-container", (container) => {
					renderAppend(
						() => (
							<ItemConnectionsOwned itemType={itemType.value} itemId={itemId.value} />
						),
						container,
					);
				}),
			),
		);

		checks.push(
			featureValueIs("formatItemMentions", true, () =>
				watch(
					".description-content > div, .item-field-container > .description-content",
					(el) => renderMentions(el),
				),
			),
		);

		checks.push(
			featureValueIs("avatarItemToggleAvatar", true, () =>
				modifyItemContextMenu(() => (
					<WearItemButton itemType={itemType.value} itemId={itemId.value} />
				)),
			),
		);

		checks.push(
			featureValueIs("itemsCollectionsButtonFix", true, () =>
				modifyItemContextMenu(() => (
					<AddToProfileButton itemId={itemId.value} itemType={itemType.value} show />
				)),
			),
		);

		checks.push(
			featureValueIs("viewItemProductInfo", true, () =>
				modifyItemStats(
					"Item",
					() => (
						<ItemProductInfo
							itemId={itemId.value}
							itemType={itemType.value}
							isAvatarItem
						/>
					),
					3,
				),
			),
		);

		checks.push(
			featureValueIs("viewItemSales", true, () =>
				modifyItemStats(
					"Item",
					() => (
						<ItemSales itemId={itemId.value} itemType={itemType.value} isAvatarItem />
					),
					2,
				),
			),
		);
		checks.push(
			featureValueIs("copyShareLinks", true, () =>
				modifyItemContextMenu(() => (
					<CopyShareLinkButton type={itemType.value} id={itemId.value} />
				)),
			),
		);

		checks.push(
			featureValueIs("blockedItems", true, () => {
				watchOnce(".content").then((el) =>
					renderAppend(
						() => <ItemBlockedScreen itemType={itemType.value} itemId={itemId.value} />,
						el,
					),
				);
			}),
		);

		checks.push(
			featureValueIs("viewAvatarItemSaleTimer", true, () =>
				watch("#item-details .item-price-value", (el) => {
					renderAfter(
						() => (
							<SaleTimer
								itemId={itemId.value}
								itemType={itemType.value}
								refresh={() => {
									sendMessage("avatarItem.refreshDetails", undefined);
								}}
							/>
						),
						el,
					);
				}),
			),
		);

		checks.push(
			featureValueIs("viewAvatarItemLastOnSale", true, () =>
				watch("#item-details .price-row-container .price-container-text", (container) => {
					renderAppend(() => {
						const [data] = usePromise(
							() =>
								getAvatarItem({
									itemId: itemId.value,
									itemType: itemType.value,
								}).then((data) => {
									if (data?.collectibleItemId) {
										return multigetCollectibleItemsByIds({
											itemIds: [data.collectibleItemId],
										}).then((data) => {
											const item = data[0];
											const dateStr = item.offSaleDeadline;

											if (
												item.price !== 1 &&
												!item.assetStock &&
												item.productSaleStatus === 2 &&
												dateStr
											) {
												const date = new Date(dateStr);
												if (date.getTime() > 0) {
													return {
														date,
														price: item.price,
													};
												}
											}
										});
									}
								}),
							[itemId.value, itemType.value],
						);

						return (
							<>
								{data && (
									<span className="text small" id="offsale-since-date">
										{getMessage("avatarItem.lastOnSale.text", {
											time: (
												<Tooltip
													as={Fragment}
													button={
														<span>
															{getFormattedDuration(data.date)}
														</span>
													}
												>
													{getAbsoluteTime(data.date)}
												</Tooltip>
											),

											hasPrice: data.price !== null,
											price: (
												<RobuxView
													priceInRobux={data.price}
													gray
													isForSale
												/>
											),
										})}
									</span>
								)}
							</>
						);
					}, container);
				}),
			),
		);

		checks.push(
			featureValueIs("viewAvatarItemPriceFloor", true, () =>
				watch(
					".price-container-text .item-info-row-container:not(.roseal-price-info) .text-robux-lg",
					(el) => {
						renderAfter(() => {
							const [data] = usePromise(
								() =>
									getAvatarItem({
										itemId: itemId.value,
										itemType: itemType.value,
									}),
								[itemId.value, itemType.value],
							);
							const [assetOrBundleType, assetOrBundleTypeId, alternativeTypes] =
								useMemo(() => {
									if (!data) {
										return [];
									}
									if (itemType.value === "Asset") {
										const type = getAssetTypeData(data.assetType);

										return [
											type?.assetType,
											type?.assetTypeId,
											type?.alternativeTypes,
										];
									}

									const type = getBundleTypeData(data.bundleType);
									return [
										type?.bundleType,
										type?.bundleTypeId,
										type?.alternativeTypes,
									];
								}, [data]);

							return (
								<>
									{data &&
										!data.itemRestrictions.includes("Collectible") &&
										!data.itemRestrictions.includes("Limited") &&
										!data.itemRestrictions.includes("LimitedUnique") &&
										!data.isOffSale &&
										assetOrBundleType &&
										assetOrBundleTypeId && (
											<DynamicFloorTooltip
												price={data.price}
												itemType={itemType.value}
												assetOrBundleType={assetOrBundleType}
												assetOrBundleTypeId={assetOrBundleTypeId}
												alternativeTypes={alternativeTypes}
											/>
										)}
								</>
							);
						}, el);
					},
				),
			),
		);

		checks.push(
			featureValueIs("viewOwnedAvatarItemPrice", true, () => {
				watch(".item-owned", (owned) => {
					const container = owned
						.closest("#item-details-container")
						?.querySelector<HTMLElement>(".price-container-text");
					if (!container) {
						return;
					}

					const firstLine = container.querySelector<HTMLElement>(".item-first-line");
					if (!firstLine) {
						return;
					}

					renderAfter(() => {
						const [langNamespace] = usePromise(() =>
							getLangNamespace("Feature.Catalog"),
						);
						const [data] = usePromise(
							() =>
								getAvatarItem({
									itemId: itemId.value,
									itemType: itemType.value,
									overrideCache: true,
								}),
							[itemId.value, itemType.value],
						);
						const [assetOrBundleType, assetOrBundleTypeId] = useMemo(() => {
							if (!data) {
								return [];
							}
							if (itemType.value === "Asset") {
								const type = getAssetTypeData(data.assetType);
								return [type?.assetType, type?.assetTypeId];
							}

							const type = getBundleTypeData(data.bundleType);
							return [type?.bundleType, type?.bundleTypeId];
						}, [data]);

						const isLimited =
							data?.itemRestrictions?.includes("Collectible") ||
							data?.itemRestrictions?.includes("LimitedUnique") ||
							data?.itemRestrictions?.includes("Limited");
						const purchasableOnWeb =
							!data?.saleLocationType ||
							WEB_PURCHASABLE_SALE_LOCATIONS.includes(data.saleLocationType);

						if (
							data?.owned &&
							!isLimited &&
							data.isOffSale &&
							langNamespace?.["Message.ItemInInventory"] === firstLine.textContent
						) {
							firstLine.textContent = getMessage(
								"avatarItem.availableInventoryOffSale",
							);
							return;
						}

						return (
							<>
								{data?.owned &&
									(!isLimited ||
										(data.quantityLimitPerUser !== 0 &&
											data.unitsAvailableForConsumption !== 0)) &&
									!data.isOffSale &&
									purchasableOnWeb && (
										<PriceInfo
											price={data.price}
											itemType={isLimited ? undefined : itemType.value}
											assetOrBundleType={
												isLimited ? undefined : assetOrBundleType
											}
											assetOrBundleTypeId={
												isLimited ? undefined : assetOrBundleTypeId
											}
										/>
									)}
							</>
						);
					}, firstLine);
				});
			}),
		);

		checks.push(
			featureValueIs("avatarItemArchiveInInventory", true, () =>
				modifyItemContextMenu(() => (
					<ArchiveInInventoryButton itemType={itemType.value} itemId={itemId.value} />
				)),
			),
		);

		checks.push(
			multigetFeaturesValues(["viewAvatarAssetDependencies", "viewAvatarAssetOwners"]).then(
				(data) => {
					if (!data.viewAvatarAssetDependencies && !data.viewAvatarAssetOwners) return;

					return watch<HTMLElement>("asset-resale-pane", (pane) => {
						if (itemType.value !== "Asset") return;
						renderBefore(
							<AvatarItemTabs
								resalePane={pane}
								assetId={itemId.value}
								enableDependencies={data.viewAvatarAssetDependencies}
								enableOwners={data.viewAvatarAssetOwners}
							/>,
							pane,
						);
					});
				},
			),
		);

		checks.push(
			featureValueIs("avatarItemSearchByCreator", true, () =>
				watch(
					".item-details-creator-container .verified-badge-icon-item-details, .item-details-creator-container:not(:has(.verified-badge-icon-item-details)) .text-label",
					(el) => {
						renderAfter(
							() => (
								<SearchByCreatorButton
									itemType={itemType.value}
									itemId={itemId.value}
								/>
							),
							el,
						);
					},
				),
			),
		);

		checks.push(
			featureValueIs("avatarItemCreatedUpdated", true, async () => {
				const lastUpdatedByStr = (await watchOnce("#item-info-container-frontend"))?.dataset
					.groupLastEditedById;

				checks.push(
					watch("#tradable-content", async (content) => {
						const prevSibling = content.previousElementSibling;
						const parent = content.parentElement;

						if (!prevSibling || !parent) return;
						const text = (await getLangNamespace("Feature.Catalog"))?.["Label.Created"];
						if (prevSibling.textContent !== text) return;
						hideEl(parent);
					}),
				);

				return modifyItemStats(
					"Item",
					() => (
						<ItemUpdatedCreated
							itemType={itemType.value}
							itemId={itemId.value}
							target="avatarItems"
							updatedBy={
								lastUpdatedByStr
									? {
											itemId: itemId.value,
											itemType: itemType.value,
											userId: Number.parseInt(lastUpdatedByStr, 10),
										}
									: undefined
							}
						/>
					),
					-1,
				);
			}),
		);

		checks.push(
			featureValueIs("viewItemFavoritedDate", true, () => {
				const _signal = signal(false);

				return watch("#favorites-button .tooltip-container", (el) => {
					if (el.hasAttribute("roseal-item-favorited-date-container")) {
						return;
					}
					el.setAttribute("roseal-item-favorited-date-container", "");

					const icon = el.querySelector<HTMLElement>("#favorite-icon");
					if (!icon) return;

					_signal.value = icon.classList.contains("favorited");

					watchAttributes(icon, () => {
						setTimeout(() => {
							_signal.value = icon.classList.contains("favorited");
						}, 100);
					}, ["class"]);

					renderAfter(
						() => (
							<ItemFavoritedSince
								itemType={itemType.value}
								itemId={itemId.value}
								signal={_signal}
							/>
						),
						el,
					);
				});
			}),
		);

		checks.push(
			featureValueIs("avatarItemRefreshDetails", true, () =>
				watch("#item-details-container .item-details-info-header .right", (right) => {
					renderAppend(
						<Tooltip
							as="div"
							id="refresh-details-button-container"
							placement="top"
							button={
								<Icon
									id="refresh-details-button"
									name="common-refresh"
									className="rbx-menu-item btn-generic-more-sm"
									onClick={() => {
										sendMessage("avatarItem.refreshDetails", undefined);
									}}
								/>
							}
						>
							{getMessage("avatarItem.refreshDetails")}
						</Tooltip>,
						right,
					);
				}),
			),
		);

		const handleChange = (link: string) => {
			const match = getPathFromMaybeUrl(link)?.realPath.match(AVATAR_ITEM_REGEX);
			if (!match) {
				return;
			}

			const newItemId = Number.parseInt(match[2], 10);
			const newItemType = match[1] === "bundles" ? "Bundle" : "Asset";
			if (itemId.value === newItemId && itemType.value === newItemType) {
				return;
			}
			batch(() => {
				pageType.value = newItemType === "Bundle" ? "bundles" : "catalog";
				itemType.value = newItemType;
				itemId.value = newItemId;
			});

			getAvatarItem({
				itemType: newItemType,
				itemId: newItemId,
			});

			invokeMessage("avatarItem.changeItem", {
				itemId: newItemId,
				itemType: newItemType,
			});
		};

		featureValueIs("viewAvatarItemBundles", true, () => {
			let previousContainerNode: ContainerNode | undefined;

			watch("#item-details-container", (container) => {
				if (previousContainerNode) {
					render(null, previousContainerNode);
				}
				previousContainerNode = renderBefore(
					() => pageType.value === "catalog" && <ItemBundles assetId={itemId.value} />,
					container,
				);
			});
		});

		checks.push(
			addMessageListener("avatarItem.showSystemFeedback", (data) => {
				let type = data.type;
				if (!data.purchased && !data.loading) {
					if (data.realReason && allowedFastPurchaseReasons.includes(data.realReason)) {
						type = data.realReason;
					} else if (data.reason && allowedFastPurchaseReasons.includes(data.reason)) {
						type = data.reason;
					} else if (data.divType && allowedFastPurchaseTypeDivs.includes(data.divType)) {
						type = data.divType;
					}
				}

				const key = `avatarItem.purchase.${
					data.purchased ? "success" : data.loading ? "loading" : "error"
				}.${type}`;
				if (data.purchased) {
					success(
						getMessage(
							hasMessage(key) ? key : "avatarItem.purchase.success.GenericPurchase",
						),
					);
				} else if (data.loading) {
					loading(getMessage(hasMessage(key) ? key : "avatarItem.purchase.loading.Load"));
				} else {
					warning(
						getMessage(
							hasMessage(key) ? key : "avatarItem.purchase.error.GenericPurchase",
							{
								reason: data.reason || "Internal Error",
								realReason:
									data.realReason || (data.status ? `HTTP ${data.status}` : "?"),
							},
						),
					);
				}
			}),
		);

		const handleUrlChange = () => handleChange(location.href);
		globalThis.addEventListener("urlchange", handleUrlChange);
		checks.push(() => {
			globalThis.removeEventListener("urlchange", handleUrlChange);
		});

		checks.push(
			featureValueIs("viewAvatarItemSaleExperiences", true, () =>
				getLangNamespace("Feature.ItemModel").then((itemModel) => {
					const message = itemModel["Label.InExperienceOnly"];
					return watch(
						".item-first-line:not(#roseal-sale-universes-text)",
						(firstLine) => {
							if (firstLine.textContent === message) {
								renderAsContainer(
									<InExperienceOnlyUniversesField
										originalContent={firstLine.textContent}
										itemType={itemType.value}
										itemId={itemId.value}
									/>,
									firstLine,
								);
							}
						},
					);
				}),
			),
		);

		checks.push(
			featureValueIs("blockedItems", true, () =>
				modifyItemContextMenu(() => (
					<BlockItemButton itemType={itemType.value} itemId={itemId.value} />
				)),
			),
		);

		checks.push(
			featureValueIs("viewAvatarBundleRecolorable", true, () =>
				modifyItemStats(
					"Item",
					() =>
						itemType.value === "Bundle" ? (
							<BundleRecolorableField bundleId={itemId.value} />
						) : (
							<></>
						),
					-2,
				),
			),
		);

		checks.push(
			featureValueIs("viewAvatarItemTags", true, () =>
				modifyItemStats(
					"Item",
					() => <ItemTags itemType={itemType.value} itemId={itemId.value} />,
					-1,
				),
			),
		);

		return () => {
			// @ts-expect-error: fine
			Promise.all(checks).then((checks) => {
				for (const check of checks) check?.();
			});
		};
	},
} satisfies Page;

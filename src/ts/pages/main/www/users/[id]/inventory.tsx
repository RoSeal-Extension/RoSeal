import storageSignal from "src/ts/components/hooks/storageSignal";
import InventoryItemObtainedDate from "src/ts/components/userInventory/ObtainedDate";
import UserInventorySortOptions from "src/ts/components/userInventory/SortOptions";
import { ARCHIVED_ITEMS_STORAGE_KEY, type ArchivedItemsStorageValue } from "src/ts/constants/misc";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import { watch, watchTextContent } from "src/ts/helpers/elements";
import {
	featureValueIs,
	getFeatureValue,
	multigetFeaturesValues,
} from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { multigetBadgesAwardedDates } from "src/ts/helpers/requests/services/badges";
import type { ListedUserInventoryAssetDetailed } from "src/ts/helpers/requests/services/inventory";
import { getUserById } from "src/ts/helpers/requests/services/users";
import { getInventoryFavoritesCategories } from "src/ts/specials/getInventoryFavoritesCategories";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import {
	AVATAR_ITEM_REGEX,
	BADGE_DETAILS_REGEX,
	CREATOR_STORE_ASSET_REGEX,
	USER_INVENTORY_REGEX,
} from "src/ts/utils/regex";
import { renderAfter, renderAppend } from "src/ts/utils/render";

export default {
	id: "user.inventory",
	regex: [USER_INVENTORY_REGEX],
	css: ["css/userInventory.css"],
	runInIframe: true,
	fn: async ({ regexMatches }) => {
		const authenticatedUser = await getAuthenticatedUser();

		const targetUserId = regexMatches?.[0]?.[2]
			? Number.parseInt(regexMatches?.[0]?.[2], 10)
			: (authenticatedUser?.userId ?? 1);

		const isCurrentUserPage = targetUserId === authenticatedUser?.userId;

		featureValueIs("inventorySortFilters", true, () =>
			watch("#inventory-container .header-content:has(.get-more)", (header) => {
				renderAfter(
					<UserInventorySortOptions
						userId={targetUserId}
						isFavoritesPage={false}
						isViewingAuthenticatedUser={isCurrentUserPage}
					/>,
					header,
				);
			}),
		);

		multigetFeaturesValues([
			"viewMoreInventoryFavoritesTypes",
			"avatarItemArchiveInInventory",
		]).then((data) => {
			if (!data.viewMoreInventoryFavoritesTypes && !data.avatarItemArchiveInInventory) return;

			const otherCategory =
				data.avatarItemArchiveInInventory && isCurrentUserPage
					? {
							name: "Archived",
							displayName: "Archived",
							categoryType: "Archived",
							items: [
								{
									name: "Archived",
									displayName: "Archived",
									filter: null,
									id: -1,
									type: "AssetType" as const,
									categoryType: "Archived",
								},
							],
						}
					: undefined;
			if (data.viewMoreInventoryFavoritesTypes) {
				sendMessage(
					"user.inventory.setupCategories",
					getInventoryFavoritesCategories(
						true,
						isCurrentUserPage,
						otherCategory ? [otherCategory] : undefined,
					),
				);
			} else if (otherCategory) {
				sendMessage("user.inventory.addCategory", otherCategory);
			}

			if (data.avatarItemArchiveInInventory && isCurrentUserPage) {
				sendMessage("user.inventory.setupArchive", undefined);

				const [value] = storageSignal<ArchivedItemsStorageValue>(
					ARCHIVED_ITEMS_STORAGE_KEY,
					{
						items: [],
					},
				);

				value.subscribe((value) => {
					sendMessage("user.inventory.setArchivedItems", value.items);
				});
			}
		});

		if (!isCurrentUserPage)
			featureValueIs("userPagesNewTitle", true, () =>
				getUserById({ userId: targetUserId })
					.then((data) => {
						const { name, displayName } = data;
						if (name === displayName) return;

						watch(".page-content > h1", (title) => {
							const newText = getMessage("userInventory.newTitle", {
								displayName,
								username: name,
							});

							watchTextContent(title, () => {
								if (newText === title.textContent) return;

								title.textContent = newText;
							});

							title.textContent = newText;
						});
					})
					.catch(() => {}),
			);

		featureValueIs("viewInventoryItemObtainedDate", true, () => {
			const assets: {
				assetTypeId: number;
				items: ListedUserInventoryAssetDetailed[];
			} = {
				assetTypeId: 0,
				items: [],
			};
			addMessageListener("user.inventory.addAssets", (data) => {
				if (data.assetTypeId !== assets.assetTypeId) {
					assets.assetTypeId = data.assetTypeId;
					assets.items = data.items;
				} else {
					assets.items.push(...data.items);
				}
			});

			watch(
				".assets-explorer-main-content .list-item:last-child .item-card-link[href]",
				async () => {
					const itemCards = document.querySelectorAll<HTMLAnchorElement>(
						".assets-explorer-main-content .item-card-link[href]",
					);
					const badgeIds: number[] = [];
					const cardToBadgeId = new Map<HTMLAnchorElement, number>();
					for (const card of itemCards) {
						const href = new URL(card.href);
						if (!href) continue;

						const badgeIdStr = href.pathname.match(BADGE_DETAILS_REGEX)?.[1];
						if (!badgeIdStr) continue;
						const badgeId = Number.parseInt(badgeIdStr, 10);
						badgeIds.push(badgeId);
						cardToBadgeId.set(card, badgeId);
					}

					if (!badgeIds.length) return;

					const data = await multigetBadgesAwardedDates({
						userId: targetUserId,
						badgeIds,
					});
					for (const [card, badgeId] of cardToBadgeId) {
						const awardedDate = data.find(
							(item) => item.badgeId === badgeId,
						)?.awardedDate;

						if (!awardedDate) continue;

						const thumbContainer = card.querySelector<HTMLDivElement>(
							".item-card-thumb-container",
						);
						if (!thumbContainer) return;

						getFeatureValue("viewInventoryItemObtainedDate.showOnHover").then(
							(value) => {
								const el = (
									<InventoryItemObtainedDate
										showOnHover={value === true}
										time={awardedDate}
										type="Badge"
									/>
								);
								if (value) {
									renderAppend(el, thumbContainer);
								} else {
									renderAfter(el, thumbContainer);
								}
							},
						);
					}
				},
			);

			watch<HTMLAnchorElement>(
				".assets-explorer-main-content .item-card-link[href]",
				(itemLink) => {
					const itemCard = itemLink.closest(".list-item");
					const itemParent = itemCard?.parentElement;
					if (!itemCard || !itemParent) return;

					const url = new URL(itemLink.href);
					const assetIdStr =
						url.pathname.match(AVATAR_ITEM_REGEX)?.[2] ??
						url.pathname.match(CREATOR_STORE_ASSET_REGEX)?.[1];
					if (!assetIdStr) return;
					const assetId = Number.parseInt(assetIdStr, 10);

					const linkIndex = Array.from(itemParent.childNodes)
						.filter((item) => {
							if (item.nodeType !== Node.ELEMENT_NODE) return false;

							return (
								(item as Element).querySelector<HTMLAnchorElement>(
									".item-card-link",
								)?.href === itemLink.href
							);
						})
						.indexOf(itemCard);
					const targetSerialNumber = itemLink
						.closest(".list-item")
						?.querySelector(".item-serial-number")
						?.textContent?.slice(1);

					const pageNumberStr = document.body
						.querySelector(
							".assets-explorer-main-content .pager-holder .pager li:not([class])",
						)
						?.textContent?.match(/(\d+)/)?.[1];
					if (!pageNumberStr) return;
					const pageNumber = Number.parseInt(pageNumberStr, 10);

					let detail: ListedUserInventoryAssetDetailed | undefined;
					const pageItems = assets.items.slice((pageNumber - 1) * 30, pageNumber * 30);

					for (const item of pageItems) {
						const itemIndex = pageItems
							.filter((item) => item.assetId === assetId)
							.indexOf(item);
						if (item.assetId === assetId) {
							if (item.serialNumber) {
								if (targetSerialNumber !== item.serialNumber.toString()) {
									continue;
								}
							}

							if (itemIndex !== linkIndex) {
								continue;
							}

							detail = item;
							break;
						}
					}

					if (!detail) return;
					const thumbContainer = itemCard.querySelector<HTMLDivElement>(
						".item-card-thumb-container",
					);
					if (!thumbContainer) return;

					getFeatureValue("viewInventoryItemObtainedDate.showOnHover").then((value) => {
						const el = (
							<InventoryItemObtainedDate
								time={detail.created}
								type="Item"
								showOnHover={value === true}
							/>
						);

						if (value) {
							renderAppend(el, thumbContainer);
						} else {
							renderAfter(el, thumbContainer);
						}
					});
				},
			);
		});
	},
} as Page;

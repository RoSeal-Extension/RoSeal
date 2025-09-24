import ItemFavoritedDate from "src/ts/components/userInventory/FavoritedDate";
import UserInventorySortOptions from "src/ts/components/userInventory/SortOptions";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { watch, watchTextContent } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";
import { getUserById } from "src/ts/helpers/requests/services/users";
import { getInventoryFavoritesCategories } from "src/ts/specials/getInventoryFavoritesCategories";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import {
	AVATAR_ITEM_REGEX,
	CREATOR_STORE_ASSET_REGEX,
	EXPERIENCE_DETAILS_REGEX,
	USER_FAVORITES_REGEX,
} from "src/ts/utils/regex";
import { renderAfter, renderAppend } from "src/ts/utils/render";

export default {
	id: "user.favorites",
	css: ["css/userInventory.css"],
	regex: [USER_FAVORITES_REGEX],
	fn: async ({ regexMatches }) => {
		const authenticatedUser = await getAuthenticatedUser();
		const targetUserId = regexMatches?.[0]?.[2]
			? Number.parseInt(regexMatches?.[0]?.[2], 10)
			: authenticatedUser!.userId;
		const isCurrentUserPage = targetUserId === authenticatedUser?.userId;

		featureValueIs("viewMoreInventoryFavoritesTypes", true, () =>
			sendMessage(
				"user.inventory.setupCategories",
				getInventoryFavoritesCategories(false, isCurrentUserPage),
			),
		);

		if (isCurrentUserPage) {
			featureValueIs("inventorySortFilters", true, () =>
				watch("#favorites-container .header-content:has(.get-more)", (header) => {
					renderAfter(
						<UserInventorySortOptions
							userId={targetUserId}
							isFavoritesPage
							isViewingAuthenticatedUser={isCurrentUserPage}
						/>,
						header,
					);
				}),
			);

			featureValueIs("viewItemFavoritedDate", true, () => {
				watch<HTMLAnchorElement>(
					"assets-explorer .item-cards .item-card-link[href]",
					(itemLink) => {
						const itemCard = itemLink.closest(".list-item");
						if (!itemCard) return;

						const url = new URL(itemLink.href);
						const avatarItemMatch = url.pathname.match(AVATAR_ITEM_REGEX);
						const creatorStoreMatch = url.pathname.match(CREATOR_STORE_ASSET_REGEX);
						const experienceDetailsMatch = url.pathname.match(EXPERIENCE_DETAILS_REGEX);
						if (!avatarItemMatch && !creatorStoreMatch && !experienceDetailsMatch)
							return;

						let itemType: MarketplaceItemType = "Asset";
						let itemId: number | undefined;
						if (avatarItemMatch) {
							itemType = avatarItemMatch[1] === "bundles" ? "Bundle" : "Asset";
							itemId = Number.parseInt(avatarItemMatch[2], 10);
						} else if (creatorStoreMatch) {
							itemId = Number.parseInt(creatorStoreMatch[1], 10);
						} else if (experienceDetailsMatch) {
							itemId = Number.parseInt(experienceDetailsMatch[1], 10);
						}

						if (!itemId) return;

						const thumbContainer = itemCard.querySelector<HTMLDivElement>(
							".item-card-thumb-container",
						);
						if (!thumbContainer) return;

						getFeatureValue("viewItemFavoritedDate.showOnHover").then((value) => {
							const el = (
								<ItemFavoritedDate
									itemType={itemType}
									itemId={itemId}
									userId={targetUserId}
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
		} else
			featureValueIs("userPagesNewTitle", true, () =>
				getUserById({ userId: targetUserId })
					.then((data) => {
						const { name, displayName } = data;
						if (name === displayName) return;

						watch(".page-content > h1", (title) => {
							const newText = getMessage("userFavorites.newTitle", {
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
	},
} as Page;

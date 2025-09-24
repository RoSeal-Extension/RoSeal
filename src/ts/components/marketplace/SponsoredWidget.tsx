import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	listSponsoredItems,
	multigetAvatarItems,
} from "src/ts/helpers/requests/services/marketplace";
import { isAvatarItemBlocked } from "src/ts/utils/blockedItems";
import usePromise from "../hooks/usePromise";
import type { MarketplaceCardProps } from "./Card";
import ItemsListContainer from "./ItemsListContainer";

export default function MarketplaceSponsoredWidget() {
	const [sponsoredItems] = usePromise(
		() =>
			listSponsoredItems({
				catalogCategoryType: "Recommended",
				placementLocation: "AvatarShop",
				count: 20,
			}),
		[],
	);
	const [items] = usePromise(
		() =>
			sponsoredItems?.data &&
			multigetAvatarItems({
				items: sponsoredItems.data,
			}).then((data) => {
				const items: MarketplaceCardProps[] = [];
				for (const item of data) {
					if (
						isAvatarItemBlocked(
							item.id,
							item.itemType,
							item.creatorType,
							item.creatorTargetId,
							item.name,
							item.description,
						)
					)
						continue;

					items.push({
						type: item.itemType,
						id: item.id,
						name: item.name,
						creator: {
							id: item.creatorTargetId,
							type: item.creatorType,
							name: item.creatorName,
							hasVerifiedBadge: item.creatorHasVerifiedBadge,
						},
						totalPrice: item.lowestPrice ?? item.price,
						itemRestrictions: item.itemRestrictions,
						totalQuantity: item.totalQuantity,
						remaining: item.unitsAvailableForConsumption,
						encryptedAdTrackingData: sponsoredItems.data?.find(
							(item2) => item.itemType === item2.itemType && item.id === item2.id,
						)?.encryptedAdTrackingData,
					});
				}

				return items;
			}),
		[sponsoredItems],
	);

	const [infoText] = usePromise(
		() =>
			getLangNamespace("Feature.GamePage").then((data) => data["Label.SponsoredDisclosure"]),
		[],
	);

	return (
		<ItemsListContainer
			listClassName="hlist item-cards-stackable organic-items-wrapper"
			title={getMessage("marketplace.landing.categories.Sponsored")}
			infoText={infoText || undefined}
			items={items || undefined}
		/>
	);
}

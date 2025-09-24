import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	MarketplaceCategoryFilterV2,
	MarketplaceSortType,
	searchItemsDetailsV2,
} from "src/ts/helpers/requests/services/marketplace";
import { isAvatarItemBlocked } from "src/ts/utils/blockedItems";
import usePromise from "../../hooks/usePromise";
import type { MarketplaceCardProps } from "../Card";
import ItemsListContainer from "../ItemsListContainer";

export default function MarketplaceRFYWidget() {
	const [recommendations] = usePromise(
		() =>
			searchItemsDetailsV2({
				categoryFilter: MarketplaceCategoryFilterV2.Recommended,
				sortType: MarketplaceSortType.Relevance,
				creatorType: "All",
				includeNotForSale: false,
				limit: 60,
			}).then((data) => {
				const items: MarketplaceCardProps[] = [];
				for (const item of data.data) {
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
					});
				}

				return items;
			}),
		[],
	);

	return (
		<ItemsListContainer
			listClassName="hlist item-cards-stackable organic-items-wrapper"
			title={getMessage("marketplace.landing.categories.OrganicContent")}
			items={recommendations || undefined}
		/>
	);
}

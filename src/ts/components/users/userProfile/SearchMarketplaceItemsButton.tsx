import { getAvatarMarketplaceLink } from "src/ts/utils/links";
import Icon from "../../core/Icon";
import usePromise from "../../hooks/usePromise";
import {
	MarketplaceSortType,
	searchItemsDetails,
} from "src/ts/helpers/requests/services/marketplace";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { differenceInYears } from "date-fns";

export type SearchMarketplaceItemsButtonProps = {
	userId: number;
};

export default function SearchMarketplaceItemsButton({
	userId,
}: SearchMarketplaceItemsButtonProps) {
	const [details] = usePromise(() => {
		return searchItemsDetails({
			creatorTargetId: userId,
			creatorType: "User",
			sortType: MarketplaceSortType.RecentlyCreated,
			includeNotForSale: false,
		}).then((data) => {
			const item = data.data.find((item) => item.itemType === "Asset");
			if (!item) {
				return;
			}

			return getAssetById({
				assetId: item.id,
			}).then((data) => {
				// if date.updated is within the past 2 years
				const date = new Date(data.updated);
				if (differenceInYears(new Date(), date) <= 2) {
					return [true, item.creatorName] as const;
				}
			});
		});
	}, [userId]);
	if (!details?.[0]) {
		return null;
	}
	return (
		<a
			className="search-user-marketplace-items-btn text-link"
			href={getAvatarMarketplaceLink({
				Category: 1,
				CreatorName: details?.[1],
				CreatorType: "User",
			})}
		>
			<Icon name="menu-shop" />
			<span>{getMessage("user.shop")}</span>
		</a>
	);
}

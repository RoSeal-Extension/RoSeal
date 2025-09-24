import {
	getAvatarItem,
	listAssetToCategoryMapping,
	listAssetToSubcategoryMapping,
	type GenericMarketplaceCreator,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import Tooltip from "../core/Tooltip";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Icon from "../core/Icon";
import { getAvatarMarketplaceLink } from "src/ts/utils/links";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { getAssetTypeData, getBundleTypeData } from "src/ts/utils/itemTypes";
import LazyLink from "../core/LazyLink";

export type SearchByCreatorButtonProps = {
	itemId: number;
	itemType: MarketplaceItemType;
	assetOrBundleTypeId?: number;
	creator?: GenericMarketplaceCreator;
};

export default function SearchByCreatorButton({
	itemId,
	itemType,
	assetOrBundleTypeId,
	creator,
}: SearchByCreatorButtonProps) {
	const [data] = usePromise(() => {
		if (creator && assetOrBundleTypeId) {
			return {
				creator,
				assetOrBundleTypeId,
			};
		}

		if (itemType === "Bundle") {
			return getAvatarItem({
				itemType,
				itemId,
			}).then((data) => {
				if (data) {
					return {
						creator: {
							name: data.creatorName,
							type: data.creatorType,
						},
						assetOrBundleTypeId: data.bundleType,
					};
				}
			});
		}

		return getAssetById({
			assetId: itemId,
		}).then((data) => ({
			assetOrBundleTypeId: data.assetTypeId,
			creator: {
				name: data.creator.name,
				type: data.creator.creatorType,
			},
		}));
	}, [itemId, itemType, assetOrBundleTypeId, creator]);

	const [searchLink] = usePromise(() => {
		if (!data) {
			return;
		}
		return Promise.all([listAssetToCategoryMapping(), listAssetToSubcategoryMapping()]).then(
			([categories, subcategories]) => {
				let categoryDetail: Record<string, string | number | undefined> = {
					Category: itemType === "Bundle" ? 17 : categories[data.assetOrBundleTypeId],
					Subcategory:
						itemType === "Bundle" ? undefined : subcategories[data.assetOrBundleTypeId],
				};

				const typeData = (itemType === "Asset" ? getAssetTypeData : getBundleTypeData)(
					data.assetOrBundleTypeId,
				);

				if (typeData?.searchQuery) {
					categoryDetail = typeData.searchQuery;
				}

				return getAvatarMarketplaceLink({
					...categoryDetail,
					CreatorName: data.creator.name!,
					CreatorType: data.creator.type!,
				});
			},
		);
	}, [itemId, itemType, data]);

	return (
		<Tooltip
			containerId="search-by-creator-btn"
			button={
				<LazyLink href={searchLink || undefined} target="_blank" rel="noreferrer">
					<Icon name="common-search" size="sm" />
				</LazyLink>
			}
		>
			{getMessage("avatarItem.searchByCreator")}
		</Tooltip>
	);
}

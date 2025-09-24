import { getMessage } from "src/ts/helpers/i18n/getMessage";
import ItemField from "../core/items/ItemField";
import RobuxView from "../core/RobuxView";
import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";
import DynamicFloorTooltip from "./DynamicFloorTooltip";
import useFeatureValue from "../hooks/useFeatureValue";

export type PriceInfoProps = {
	price?: number | null;
	itemType?: MarketplaceItemType;
	assetOrBundleType?: string;
	assetOrBundleTypeId?: number;
	alternativeTypes?: string[];
};

export default function PriceInfo({
	price,
	itemType,
	assetOrBundleType,
	assetOrBundleTypeId,
	alternativeTypes,
}: PriceInfoProps) {
	const [isViewAvatarItemPriceFloorEnabled] = useFeatureValue("viewAvatarItemPriceFloor", false);

	return (
		<ItemField
			className="roseal-price-info"
			labelClassName="price-label"
			title={getMessage("item.price")}
		>
			<div className="price-info row-content">
				<div className="item-price-value icon-text-wrapper clearfix icon-robux-price-container">
					<RobuxView priceInRobux={price} isForSale largeText alignCenter={false} />
					{isViewAvatarItemPriceFloorEnabled &&
						itemType &&
						assetOrBundleType &&
						assetOrBundleTypeId &&
						!!price && (
							<DynamicFloorTooltip
								price={price}
								itemType={itemType}
								assetOrBundleTypeId={assetOrBundleTypeId}
								assetOrBundleType={assetOrBundleType}
								alternativeTypes={alternativeTypes}
							/>
						)}
				</div>
			</div>
		</ItemField>
	);
}

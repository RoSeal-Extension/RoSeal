import { getMessage } from "src/ts/helpers/i18n/getMessage";
import ItemField from "../core/items/ItemField";
import RobuxView from "../core/RobuxView";
import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";

export type PriceInfoProps = {
	price?: number | null;
	itemType?: MarketplaceItemType;
	assetOrBundleType?: string;
	assetOrBundleTypeId?: number;
	alternativeTypes?: string[];
};

export default function PriceInfo({ price }: PriceInfoProps) {
	return (
		<ItemField
			className="roseal-price-info"
			labelClassName="price-label"
			title={getMessage("item.price")}
		>
			<div className="price-info row-content">
				<div className="item-price-value icon-text-wrapper clearfix icon-robux-price-container">
					<RobuxView priceInRobux={price} isForSale largeText alignCenter={false} />
				</div>
			</div>
		</ItemField>
	);
}

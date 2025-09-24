import {
	getCollectiblesMetadata,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import Tooltip from "../core/Tooltip";
import usePromise from "../hooks/usePromise";
import RobuxView from "../core/RobuxView";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getMarketplacePricingLink } from "src/ts/utils/links";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";
import MdOutlineInfoIcon from "@material-symbols/svg-400/outlined/info.svg";

export type DynamicFloorTooltipProps = {
	itemType: MarketplaceItemType;
	assetOrBundleType: string;
	assetOrBundleTypeId: number;
	alternativeTypes?: string[];
	price: number;
};

export default function DynamicFloorTooltip({
	itemType,
	assetOrBundleType,
	assetOrBundleTypeId,
	alternativeTypes,
	price,
}: DynamicFloorTooltipProps) {
	const [floorPrice] = usePromise(
		() =>
			getCollectiblesMetadata().then((data) => {
				let result: number | undefined =
					data.unlimitedItemPriceFloors[assetOrBundleType]?.priceFloor;
				if (result === undefined && alternativeTypes) {
					for (const key of alternativeTypes) {
						result = data.unlimitedItemPriceFloors[key]?.priceFloor;
						if (result !== undefined) {
							break;
						}
					}
				}

				return result;
			}),
		[itemType, assetOrBundleType],
	);

	return (
		<>
			{!!floorPrice && (
				<Tooltip
					containerClassName="dynamic-floor-info-text"
					button={
						<a href={getMarketplacePricingLink()} target="_blank" rel="noreferrer">
							<MdOutlineInfoIcon className="roseal-icon" />
						</a>
					}
				>
					{getMessage("avatarItem.dynamicFloorPrice.tooltip", {
						displayType: getItemTypeDisplayLabel(
							itemType,
							"category",
							assetOrBundleTypeId,
						),
						isOverFloorPrice: price > floorPrice,
						overFloorPrice: (
							<RobuxView priceInRobux={price - floorPrice} isForSale gray smallIcon />
						),
						floorPrice: (
							<RobuxView priceInRobux={floorPrice} isForSale gray smallIcon />
						),
						lineBreak: <br />,
					})}
				</Tooltip>
			)}
		</>
	);
}

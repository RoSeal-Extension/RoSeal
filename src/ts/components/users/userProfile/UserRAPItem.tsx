import { getAvatarAssetLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import type { ListedUserCollectibleAsset } from "src/ts/helpers/requests/services/inventory";
import Icon from "../../core/Icon";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import RobuxView from "../../core/RobuxView";
import { useMemo } from "preact/hooks";
import { getItemRestrictionsClassName } from "../../marketplace/utils/items";

export type UserRAPItemProps = {
	item: ListedUserCollectibleAsset;
};

export default function UserRAPItem({ item }: UserRAPItemProps) {
	const restrictionLabel = useMemo(() => {
		return getItemRestrictionsClassName(
			item.serialNumber !== null && item.serialNumber !== undefined
				? ["LimitedUnique"]
				: ["Limited"],
		);
	}, [item.serialNumber]);

	return (
		<li className="list-item item-card">
			<div className="item-card-container">
				<a href={getAvatarAssetLink(item.assetId, item.name)}>
					<div className="item-card-link">
						<div className="item-card-thumb-container">
							<Thumbnail
								request={{
									type: "Asset",
									targetId: item.assetId,
									size: "420x420",
								}}
							/>
							{restrictionLabel && <span className={restrictionLabel} />}
							<div className="limited-icon-container">
								<Icon name="shop-limited" />
								{item.serialNumber !== undefined && item.serialNumber !== null && (
									<span className="font-caption-header text-subheader limited-number">
										{getMessage(
											"user.header.social.rap.modal.body.item.serialNumber",
											{
												serialNumber: asLocaleString(item.serialNumber),
											},
										)}
									</span>
								)}
							</div>
						</div>
					</div>
					<div className="item-card-caption">
						<div className="item-card-name-link">
							<div className="item-card-name" title={item.name}>
								{item.name}
							</div>
							<RobuxView
								priceInRobux={item.recentAveragePrice}
								containerClassName="text-overflow item-card-price"
							/>
						</div>
					</div>
				</a>
			</div>
		</li>
	);
}

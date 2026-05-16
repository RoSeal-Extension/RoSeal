import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { UserTradableItemInstance } from "src/ts/helpers/requests/services/trades";
import { getAvatarAssetLink, getAvatarBundleLink } from "src/ts/utils/links";
import Icon from "../../core/Icon";
import RobuxView from "../../core/RobuxView";
import Thumbnail from "../../core/Thumbnail";
import { getItemRestrictionsClassName } from "../../marketplace/utils/items";

export type UserRAPItemProps = {
	item: UserTradableItemInstance;
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
				<a
					href={
						item.itemTarget.itemType === "Asset"
							? getAvatarAssetLink(item.itemTarget.targetId, item.itemName)
							: getAvatarBundleLink(item.itemTarget.targetId, item.itemName)
					}
					target="_blank"
					rel="noopener noreferrer"
				>
					<div className="item-card-link">
						<div className="item-card-thumb-container">
							<Thumbnail
								request={{
									type:
										item.itemTarget.itemType === "Bundle"
											? "BundleThumbnail"
											: "Asset",
									targetId: item.itemTarget.targetId,
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
							<div className="item-card-name" title={item.itemName}>
								{item.itemName}
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

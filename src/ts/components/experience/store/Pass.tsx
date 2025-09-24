import { getPassDetailsLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import classNames from "classnames";
import RobuxView from "../../core/RobuxView";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import PassPurchaseButton from "./PassPurchaseButton";
import usePromise from "../../hooks/usePromise";
import { getPassProductById } from "src/ts/helpers/requests/services/passes";
import type { RobloxSharedExperiencePass } from "src/ts/helpers/requests/services/roseal";

export type PassProps = {
	name: string;
	passId: number;
	productId?: number | null;
	sellerId?: number | null;
	sellerName?: string | null;
	priceInRobux?: number | null;
	isOwned?: boolean;
	sharedDetails?: RobloxSharedExperiencePass;
};

export default function Pass({
	name,
	passId,
	productId,
	sellerId,
	sellerName,
	priceInRobux,
	isOwned,
	sharedDetails,
}: PassProps) {
	const [productDetails] = usePromise(() => {
		return getPassProductById({
			passId,
		});
	}, [passId]);

	const displayIconAssetId = productDetails?.iconImageAssetId;

	return (
		<div
			className={classNames("store-card", {
				"is-shared": sharedDetails,
				"is-owned": isOwned,
			})}
		>
			<a
				className="gear-passes-asset store-card-link"
				href={getPassDetailsLink(passId, name)}
			>
				<Thumbnail
					containerClassName="store-card-image"
					request={
						sharedDetails?.iconData ?? {
							targetId: passId,
							type: "GamePass",
							size: "150x150",
						}
					}
				/>
			</a>
			<div className="store-card-caption">
				<div
					className="text-overflow store-card-name"
					title={sharedDetails?.displayName ?? name}
				>
					{sharedDetails?.displayName ?? name}
				</div>
				<div
					className={classNames("store-card-price", {
						offsale: !priceInRobux,
					})}
				>
					{!sharedDetails || !isOwned ? (
						<RobuxView priceInRobux={priceInRobux} useGrouping={false} />
					) : (
						<span className="item-owned-text text">
							{getMessage("experience.passes.item.owned")}
						</span>
					)}
				</div>
				<div className="store-card-footer">
					{isOwned && !sharedDetails && (
						<h5 className="item-owned-text">
							{getMessage("experience.passes.item.owned")}
						</h5>
					)}
					{(!isOwned || sharedDetails) && (
						<PassPurchaseButton
							passName={name}
							passProductId={productId ?? undefined}
							passExpectedPrice={priceInRobux}
							passExpectedSellerId={sellerId}
							passExpectedSellerName={sellerName}
							displayIcon={displayIconAssetId}
							isOwned={isOwned}
							productDetails={productDetails ?? undefined}
							sharedDetails={sharedDetails}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

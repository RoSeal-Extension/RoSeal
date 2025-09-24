import classNames from "classnames";
import { useCallback, useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { abbreviateNumber } from "src/ts/helpers/i18n/intlFormats";
import type { Agent } from "src/ts/helpers/requests/services/assets";
import {
	type AvatarItemRestriction,
	type MarketplaceWidgetItemType,
	postSponsoredItemClick,
} from "src/ts/helpers/requests/services/marketplace";
import {
	getAvatarAssetLink,
	getAvatarBundleLink,
	getAvatarLookLink,
	getCreatorProfileLink,
} from "src/ts/utils/links";
import Button from "../core/Button";
import RobuxView from "../core/RobuxView";
import Thumbnail from "../core/Thumbnail";
import useFeatureValue from "../hooks/useFeatureValue";
import VerifiedBadge from "../icons/VerifiedBadge";
import { useMarketplaceCart } from "./providers/ShoppingCartProvider";
import { getItemRestrictionsClassName } from "./utils/items";

export type MarketplaceCardCreator = {
	id?: number;
	name: string;
	type?: Agent;
	hasVerifiedBadge: boolean;
};

export type MarketplaceCardProps = {
	type: MarketplaceWidgetItemType;
	id: number | string;
	name: string;
	creator: MarketplaceCardCreator;
	totalValue?: number | null;
	totalPrice?: number | null;
	totalQuantity?: number;
	remaining?: number;
	itemRestrictions?: AvatarItemRestriction[] | null;
	encryptedAdTrackingData?: string;
};

export default function MarketplaceCard({
	type,
	id,
	name,
	creator,
	totalValue,
	totalPrice,
	totalQuantity,
	remaining,
	itemRestrictions,
	encryptedAdTrackingData,
}: MarketplaceCardProps) {
	const { shoppingCart, isShoppingCartFull, toggleShoppingCart } = useMarketplaceCart();
	const [showQuantityRemaining] = useFeatureValue("marketplaceShowQuantityRemaining", false);

	const [isHovering, setIsHovering] = useState(false);
	const [isTogglingCart, setIsTogglingCart] = useState(false);

	const label = useMemo(() => getItemRestrictionsClassName(itemRestrictions), [itemRestrictions]);
	const isInShoppingCart = useMemo(() => {
		if ((type !== "Asset" && type !== "Bundle") || !shoppingCart) return false;

		for (const item of shoppingCart.items) {
			if (item.itemType === type && item.itemId === id) return true;
		}

		return false;
	}, [type, id, shoppingCart]);
	const link = useMemo(() => {
		if (type === "Look") return getAvatarLookLink(id as string, name);
		if (type === "Asset") return getAvatarAssetLink(id as number, name);
		if (type === "Bundle") return getAvatarBundleLink(id as number, name);
	}, [type, id, name]);

	const onClick = useCallback(() => {
		if (type === "Look" || !encryptedAdTrackingData) return;

		postSponsoredItemClick({
			campaignTargetType: "Asset",
			placementLocation: "AvatarShop",
			encryptedAdTrackingData,
		});
	}, [type, encryptedAdTrackingData]);

	return (
		<li
			className={classNames("catalog-item-container", {
				"look-container-item": type === "Look",
			})}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			onClick={onClick}
		>
			<div className="item-card-container">
				<a href={link} className="item-card-link">
					<div className="item-card-link">
						<div className="item-card-thumb-container">
							<div className="item-card-thumb-container-inner">
								{!!totalQuantity && !!remaining && showQuantityRemaining && (
									<span className="quantity-remaining-text">
										{getMessage("marketplace.item.quantityLeft", {
											quantityLeft: abbreviateNumber(remaining, 99_999),
											totalQuantity: abbreviateNumber(totalQuantity, 99_999),
										})}
									</span>
								)}
								<Thumbnail
									imgClassName={type === "Look" ? "look-img" : undefined}
									containerClassName={
										type === "Look" ? "look-img-container" : undefined
									}
									request={{
										type:
											type === "Bundle"
												? "BundleThumbnail"
												: type === "Asset"
													? "Asset"
													: "Look",
										targetId: id,
										size: "420x420",
									}}
								/>
								{label && <span className={`restriction-icon ${label}`} />}
							</div>
							{isHovering &&
								(type === "Asset" || type === "Bundle") &&
								toggleShoppingCart && (
									<div className="add-to-cart-btn-container">
										<Button
											type={isInShoppingCart ? "secondary" : "primary"}
											className={classNames({
												"add-to-cart": isInShoppingCart,
												"remove-from-cart": !isInShoppingCart,
											})}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();

												setIsTogglingCart(true);
												toggleShoppingCart!(type, id as number).then(() =>
													setIsTogglingCart(false),
												);
											}}
											disabled={
												isTogglingCart ||
												(isShoppingCartFull && !isInShoppingCart)
											}
										>
											{getMessage(
												`marketplace.item.cart.${isInShoppingCart ? "remove" : isShoppingCartFull ? "maximumItems" : "add"}`,
											)}
										</Button>
									</div>
								)}
						</div>
					</div>
					<div className="item-card-caption">
						<div className="item-card-name-link">
							<div className="item-card-name-link">{name}</div>
						</div>
						<div className="item-card-secondary-info text-secondary">
							<div className="text-overflow item-card-creator">
								<span className="text-overflow">
									{getMessage("item.byWith@", {
										creatorType: creator.type,
										creatorName: creator.name,
										creatorLink: (contents: string) => {
											if (
												creator.id !== undefined &&
												creator.type !== undefined
											) {
												return (
													<a
														href={getCreatorProfileLink(
															creator.id,
															creator.type,
															creator.name,
														)}
														className="creator-name text-link"
													>
														{contents}
													</a>
												);
											}

											return <span className="creator-name">{contents}</span>;
										},
									})}
								</span>
								{creator.hasVerifiedBadge && (
									<VerifiedBadge
										width={16}
										height={16}
										className="verified-badge-icon-catalog-item-rendered"
									/>
								)}
							</div>
						</div>
						<div className="text-overflow item-card-price font-header-2 text-subheader margin-top-none">
							{totalValue !== undefined && totalValue !== totalPrice && (
								<RobuxView
									textClassName="text-robux-tile"
									containerClassName="roseal-disabled old-price"
									priceInRobux={totalValue}
									gray
									crossedOut
									isForSale
								/>
							)}
							<RobuxView
								textClassName="text-robux-tile"
								containerClassName="new-price"
								priceInRobux={totalPrice}
								isForSale
							/>
						</div>
					</div>
				</a>
			</div>
		</li>
	);
}

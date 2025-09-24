import { useEffect } from "preact/hooks";
import { modifyTitle } from "src/ts/helpers/elements.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import {
	getDeveloperProductById,
	getDeveloperProductByProductId,
} from "src/ts/helpers/requests/services/developerProducts.ts";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes.ts";
import {
	getCreatorProfileLink,
	getDeveloperProductDetailsLink,
	getExperienceLink,
} from "src/ts/utils/links.ts";
import ItemSales from "../avatarItem/Sales.tsx";
import ItemContextMenu from "../core/ItemContextMenu.tsx";
import Linkify from "../core/Linkify.tsx";
import Loading from "../core/Loading.tsx";
import MentionLinkify from "../core/MentionLinkify.tsx";
import RobuxView from "../core/RobuxView.tsx";
import Thumbnail from "../core/Thumbnail.tsx";
import Page404 from "../core/errors/404.tsx";
import ItemField from "../core/items/ItemField.tsx";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import usePromise from "../hooks/usePromise.ts";
import VerifiedBadge from "../icons/VerifiedBadge.tsx";
import ItemProductInfo from "../item/ProductInfo.tsx";
import ItemUpdatedCreated from "../item/UpdatedCreated.tsx";
import ViewIconAssetButton from "../item/ViewIconAssetButton.tsx";

export type DeveloperProductContainerProps = {
	developerProductId: number;
};

export default function DeveloperProductContainer({
	developerProductId,
}: DeveloperProductContainerProps) {
	const [details, , error] = usePromise(
		() =>
			getDeveloperProductById({
				developerProductId,
			}),
		[developerProductId],
	);
	const [productDetails, , error2] = usePromise(
		() =>
			details
				? getDeveloperProductByProductId({
						productId: details.id,
					})
				: undefined,
		[details?.id],
	);
	const [universe] = usePromise(async () => {
		const fromUniverseId = productDetails?.universeId;

		if (fromUniverseId) {
			return multigetUniversesByIds({
				universeIds: [fromUniverseId],
			}).then((data) => data[0]);
		}
	}, [productDetails]);

	useEffect(() => {
		if (!productDetails?.name) return;

		const url = getDeveloperProductDetailsLink(developerProductId, productDetails.name);
		if (location.pathname !== url) {
			history.replaceState(undefined, "", url);
		}

		modifyTitle(productDetails.displayName);
	}, [productDetails?.name]);

	const [viewMediaEnabled] = useFeatureValue("viewItemMedia", false);
	const [viewProductDetailsEnabled] = useFeatureValue("viewItemProductInfo", false);
	const [linkMentionsEnabled] = useFeatureValue("formatItemMentions", false);
	const [viewItemSalesEnabled] = useFeatureValue("viewItemSales", false);

	if (!details || !productDetails) {
		if (error || error2) {
			return <Page404 />;
		}

		return <Loading />;
	}

	return (
		<div id="item-container" className="section page-content library-item">
			<div className="section-content top-section remove-panel">
				<div className="border-bottom item-name-container">
					<h1>{productDetails.displayName}</h1>
					{universe && (
						<div className="creator-name">
							<span className="text-label">
								{getMessage("item.byWith@", {
									creatorType: universe.creator.type,
									creatorName: universe.creator.name,
									creatorLink: (contents: string) => (
										<a
											href={getCreatorProfileLink(
												universe.creator.id,
												universe.creator.type,
												universe.creator.name,
											)}
											className="text-name"
										>
											{contents}
										</a>
									),
								})}
							</span>
							{universe.creator.hasVerifiedBadge && (
								<>
									{" "}
									<VerifiedBadge className="verified-badge-icon-item-details" />
								</>
							)}
						</div>
					)}
				</div>
				<div className="item-thumbnail-container">
					<div className="asset-thumb-container thumbnail-holder thumbnail-Small">
						<Thumbnail
							containerClassName="thumbnail-span"
							request={
								productDetails.displayIconImageAssetId
									? {
											type: "Asset",
											isImageAsset: true,
											size: "150x150",
											isCircular: true,
											targetId: productDetails.displayIconImageAssetId,
										}
									: undefined
							}
						/>
						{universe && (
							<div className="related-asset-container">
								<div className="asset-info">
									<p className="preview-text small font-caption-body">
										{getMessage(
											"developerProduct.purchaseAssociatedExperience",
											{
												experienceLink: (
													<a
														href={getExperienceLink(
															universe.rootPlaceId,
															universe.name,
														)}
														className="text-name text-overflow font-caption-body"
													>
														{universe.name}
													</a>
												),
											},
										)}
									</p>
								</div>
								<div className="asset-thumbnail">
									<a
										href={getExperienceLink(
											universe.rootPlaceId,
											universe.name,
										)}
									>
										<Thumbnail
											request={{
												type: "GameIcon",
												targetId: universe.id,
												size: "150x150",
											}}
										/>
									</a>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="item-details">
					<div className="clearfix price-container">
						<div className="price-container-text">
							{details.priceInRobux ? (
								<>
									<div className="text-label field-label price-label">
										{getMessage("item.price")}
									</div>
									<div className="price-info">
										<div className="icon-text-wrapper clearfix icon-robux-price-container">
											<RobuxView
												priceInRobux={details.priceInRobux}
												largeText
											/>
										</div>
									</div>
								</>
							) : (
								<div className="item-first-line">
									{getMessage("saleStatus.offsale.long")}
								</div>
							)}
						</div>
					</div>
					<ItemField title={getMessage("item.type")} useNewClasses={false}>
						<span className="field-content text font-body">
							{getMessage("developerProduct.typeValue")}
						</span>
					</ItemField>
					{viewProductDetailsEnabled && !!details?.id && (
						<ItemProductInfo
							itemType="DeveloperProduct"
							itemId={details.id}
							isAvatarItem={false}
						/>
					)}
					<ItemUpdatedCreated
						itemType="DeveloperProduct"
						itemId={developerProductId}
						target="associatedItems"
					/>
					{viewItemSalesEnabled && universe && (
						<ItemSales
							itemType="DeveloperProduct"
							itemId={developerProductId}
							universeId={universe.id}
							isAvatarItem={false}
						/>
					)}
					{productDetails.displayDescription && (
						<ItemField title={getMessage("item.description")} useNewClasses={false}>
							<p
								id="item-details-description"
								className="field-content description-content text font-body"
							>
								{linkMentionsEnabled ? (
									<MentionLinkify
										key="mention"
										content={productDetails.displayDescription}
									/>
								) : (
									<Linkify
										key="regular"
										content={productDetails.displayDescription}
									/>
								)}
							</p>
						</ItemField>
					)}
				</div>
				{viewMediaEnabled && (productDetails.displayIconImageAssetId ?? 0) > 0 && (
					<ItemContextMenu
						id="item-context-menu"
						buttonClassName="item-context-menu"
						wrapChildren={false}
					>
						<ViewIconAssetButton
							itemType="DeveloperProduct"
							itemId={details.targetId}
							iconAssetId={productDetails.displayIconImageAssetId}
						/>
					</ItemContextMenu>
				)}
			</div>
		</div>
	);
}

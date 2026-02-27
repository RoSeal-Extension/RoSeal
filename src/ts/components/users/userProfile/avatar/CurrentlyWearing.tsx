import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import ItemCarousel from "src/ts/components/core/ItemCarousel";
import RobuxView from "src/ts/components/core/RobuxView";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";
import MarketplaceCard from "src/ts/components/marketplace/Card";
import { RTHRO_ASSET_IDS } from "src/ts/constants/robloxAssets";
import { watch, watchTextContent } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type AvatarAssetDefinitionWithTypes,
	type AvatarEmote,
	getUserAvatar,
} from "src/ts/helpers/requests/services/avatar";
import {
	type LookItemDetails,
	type MarketplaceItemType,
	multigetLookPurchaseDetails,
} from "src/ts/helpers/requests/services/marketplace";
import { emoteAssetTypeName, getAssetTypeData } from "src/ts/utils/itemTypes";
import PillToggle from "../../../core/PillToggle";
import usePromise from "../../../hooks/usePromise";
import AssetWearingBundle from "./AssetWearingBundle";

export type UserProfileCurrentlyWearingProps = {
	userId: number;
};

type ActiveTab = "assets" | "emotes" | "animations" | "bodyParts";
type EmoteWithDetails = AvatarEmote & {
	details?: LookItemDetails<MarketplaceItemType>;
	showBundle?: boolean;
};
type AssetWithDetails = AvatarAssetDefinitionWithTypes & {
	details?: LookItemDetails<MarketplaceItemType>;
	showBundle?: boolean;
};

export default function UserProfileCurrentlyWearing({ userId }: UserProfileCurrentlyWearingProps) {
	const [showEmotes] = useFeatureValue(
		"improvedUserCurrentlyWearing.viewUserEquippedEmotes",
		false,
	);
	const [separateAnimations] = useFeatureValue(
		"improvedUserCurrentlyWearing.separateAnimationsTab",
		false,
	);
	const [separateBodyParts] = useFeatureValue(
		"improvedUserCurrentlyWearing.separateBodyPartsTab",
		false,
	);
	const [showTotalValue] = useFeatureValue("improvedUserCurrentlyWearing.showTotalValue", false);
	const [showTotalValueIncludesEmotes] = useFeatureValue(
		"improvedUserCurrentlyWearing.showTotalValue.includeEmotes",
		false,
	);
	const [showTotalValueIncludesAnimations] = useFeatureValue(
		"improvedUserCurrentlyWearing.showTotalValue.includeAnimations",
		false,
	);

	const [showAssociatedBundle] = useFeatureValue(
		"improvedUserCurrentlyWearing.showAssociatedItemsBundle",
		false,
	);

	const [activeTab, setActiveTab] = useState<ActiveTab>("assets");
	const [avatar] = usePromise(() => getUserAvatar({ userId }), [userId]);
	const [purchaseDetails] = usePromise(() => {
		if (!avatar) return;

		const assetIds: number[] = [];
		for (const item of avatar.assets) {
			assetIds.push(item.id);
		}

		for (const item of avatar.emotes) {
			if (assetIds.includes(item.assetId)) continue;

			assetIds.push(item.assetId);
		}

		return multigetLookPurchaseDetails({
			assets: assetIds.map((id) => ({
				id,
			})),
		});
	}, [avatar?.assets, avatar?.emotes]);

	const [wearingAssets, wearingAnimations, emotes, bodyParts, totalValue] = useMemo(() => {
		if (!avatar) return [[], [], [], [], 0];

		const assets: AssetWithDetails[] = [];
		const animations: AssetWithDetails[] = [];
		const bodyParts: AssetWithDetails[] = [];
		const emotes: EmoteWithDetails[] = [];

		const totalValueItems = new Set<LookItemDetails<MarketplaceItemType>>();

		const assetIdToItem: Record<number, LookItemDetails<MarketplaceItemType>> = {};
		if (purchaseDetails?.look.items) {
			for (const item of purchaseDetails.look.items) {
				if (item.itemType === "Asset") {
					assetIdToItem[item.id] = item;
				} else if (item.itemType === "Bundle") {
					if (item.assetsInBundle)
						for (const item2 of item.assetsInBundle) {
							assetIdToItem[item2.id] = item;
						}
				}
			}
		}

		for (const item of avatar.assets) {
			const type = getAssetTypeData(item.assetType.id);

			const shouldInclude = !type?.isUsuallyTemplate && !RTHRO_ASSET_IDS.includes(item.id);

			const details = assetIdToItem[item.id];
			const newAsset = {
				...item,
				details,
				showBundle: shouldInclude,
			};

			const isAnimation = type?.isAnimated && type.assetType !== emoteAssetTypeName;
			const isBodyPart = type?.isBodyPart || type?.isPartOfHead;

			if (isAnimation && separateAnimations) {
				animations.push(newAsset);
			} else if (isBodyPart && separateBodyParts) {
				bodyParts.push(newAsset);
			} else {
				assets.push(newAsset);
			}

			if (
				shouldInclude &&
				details?.priceInRobux &&
				(!isAnimation || showTotalValueIncludesAnimations)
			) {
				totalValueItems.add(details);
			}
		}

		for (const item of avatar.emotes) {
			const details = assetIdToItem[item.assetId];
			emotes.push({
				...item,
				details,
				showBundle: true,
			});

			if (details?.priceInRobux && showTotalValueIncludesEmotes) {
				totalValueItems.add(details);
			}
		}

		let totalValue = 0;
		for (const item of totalValueItems) {
			totalValue += item.priceInRobux!;
		}

		return [assets, animations, emotes, bodyParts, totalValue];
	}, [avatar?.assets, purchaseDetails, separateAnimations]);

	const tabs = useMemo(() => {
		const tabs = [{ id: "assets", label: getMessage("user.avatar.tabs.assets") }];

		if (bodyParts.length && separateBodyParts) {
			tabs.push({
				id: "bodyParts",
				label: getMessage("user.avatar.tabs.bodyParts"),
			});
		}

		if (wearingAnimations.length && separateAnimations) {
			tabs.push({
				id: "animations",
				label: getMessage("user.avatar.tabs.animations"),
			});
		}

		if (emotes.length && showEmotes)
			tabs.push({
				id: "emotes",
				label: getMessage("user.avatar.tabs.emotes"),
			});

		return tabs;
	}, [emotes, wearingAnimations, bodyParts]);

	const h2HeaderRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		return watch<HTMLDivElement>(".profile-currently-wearing h2", (el) => {
			h2HeaderRef.current = el;
		});
	}, [userId]);

	useEffect(() => {
		if (!showTotalValue || !h2HeaderRef.current) return;

		const handleh2 = () => {
			// rogold is not localized, so we are ok
			const textNode = h2HeaderRef.current!.childNodes[0];
			if (!textNode.nodeValue?.includes(" | Outfit Cost")) return;

			h2HeaderRef.current!.replaceChildren(textNode.nodeValue.replace(" | Outfit Cost", ""));
		};
		handleh2();

		return watchTextContent(h2HeaderRef!.current, handleh2);
	}, [h2HeaderRef.current, showTotalValue]);

	const assetTabContent = (
		activeTab === "assets"
			? wearingAssets
			: activeTab === "animations"
				? wearingAnimations
				: activeTab === "bodyParts"
					? bodyParts
					: undefined
	)?.map((asset) => (
		<div key={asset.id} className="carousel-item">
			<MarketplaceCard
				as="div"
				type="Asset"
				id={asset.id}
				totalPrice={
					asset.details?.itemType !== "Bundle" ? asset.details?.priceInRobux : undefined
				}
				name={asset.name ?? (asset.details?.itemType === "Asset" ? asset.details.name : "")}
				itemRestrictions={
					asset.details?.itemType === "Asset"
						? asset.details?.itemRestrictions
						: undefined
				}
				containerClassName="item-card profile-item-card"
				thumbnailChildren={
					asset.details?.itemType === "Bundle" &&
					showAssociatedBundle &&
					asset.showBundle && (
						<AssetWearingBundle id={asset.details.id} name={asset.details.name} />
					)
				}
			/>
		</div>
	));

	const content = (
		<>
			{tabs.length > 1 && (
				<PillToggle
					className="roseal-accoutrements-pill"
					items={tabs}
					onClick={(id) => setActiveTab(id as ActiveTab)}
					currentId={activeTab}
				/>
			)}
			{activeTab === "assets" && (
				<ItemCarousel
					className="roseal-assets-container carousel-container"
					innerClassName="carousel"
					onlyXScroll
				>
					{assetTabContent}
				</ItemCarousel>
			)}
			{activeTab === "animations" && separateAnimations && (
				<ItemCarousel
					className="roseal-animations-container carousel-container"
					innerClassName="carousel"
					onlyXScroll
				>
					{assetTabContent}
				</ItemCarousel>
			)}
			{activeTab === "bodyParts" && separateBodyParts && (
				<ItemCarousel
					className="roseal-body-parts-container carousel-container"
					innerClassName="carousel"
					onlyXScroll
				>
					{assetTabContent}
				</ItemCarousel>
			)}
			{activeTab === "emotes" && showEmotes && (
				<ItemCarousel
					className="roseal-emotes-container carousel-container"
					innerClassName="carousel"
					onlyXScroll
				>
					{emotes.map((emote) => (
						<div key={emote.assetId} className="carousel-item">
							<MarketplaceCard
								as="div"
								type="Asset"
								id={emote.assetId}
								totalPrice={
									emote.details?.itemType !== "Bundle"
										? emote.details?.priceInRobux
										: undefined
								}
								name={emote.assetName || ""}
								itemRestrictions={
									emote.details?.itemType === "Asset"
										? emote.details?.itemRestrictions
										: undefined
								}
								containerClassName="item-card profile-item-card"
								thumbnailChildren={
									emote.details?.itemType === "Bundle" &&
									showAssociatedBundle &&
									emote.showBundle && (
										<AssetWearingBundle
											id={emote.details.id}
											name={emote.details.name}
										/>
									)
								}
							/>
						</div>
					))}
				</ItemCarousel>
			)}
		</>
	);

	return (
		<div className="profile-currently-wearing roseal-currently-wearing">
			<div className="profile-carousel roseal-profile-carousel">
				<div className="collection-carousel-container">
					<h2 className="collection-carousel-title">
						{getMessage("user.avatar.currentlyWearing", {
							totalValue: showTotalValue && (
								<span className="roseal-total-value">
									{getMessage("user.avatar.totalValue", {
										value: (
											<RobuxView
												priceInRobux={totalValue}
												isForSale
												showZero
											/>
										),
									})}
								</span>
							),
						})}
					</h2>
					{content}
				</div>
			</div>
		</div>
	);
}

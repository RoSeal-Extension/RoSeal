import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type AvatarAssetDefinitionWithTypes,
	type AvatarEmote,
	getUserAvatar,
} from "src/ts/helpers/requests/services/avatar";
import PillToggle from "../../../core/PillToggle";
import usePromise from "../../../hooks/usePromise";
import UserProfileAccoutrementItem from "./AccoutrementItem";
import {
	type LookItemDetails,
	type MarketplaceItemType,
	multigetLookPurchaseDetails,
} from "src/ts/helpers/requests/services/marketplace";
import classNames from "classnames";
import { emoteAssetTypeName, getAssetTypeData } from "src/ts/utils/itemTypes";
import { RTHRO_ASSET_IDS } from "src/ts/constants/robloxAssets";
import { watch } from "src/ts/helpers/elements";
import RobuxView from "src/ts/components/core/RobuxView";
import { createPortal } from "preact/compat";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";

export type UserProfileCurrentlyWearingProps = {
	userId: number;
	forEmotes?: boolean;
};

type ActiveTab = "assets" | "emotes" | "animations";
type EmoteWithDetails = AvatarEmote & {
	details?: LookItemDetails<MarketplaceItemType>;
	showBundle?: boolean;
};
type AssetWithDetails = AvatarAssetDefinitionWithTypes & {
	details?: LookItemDetails<MarketplaceItemType>;
	showBundle?: boolean;
};

export default function UserProfileCurrentlyWearing({
	userId,
	forEmotes,
}: UserProfileCurrentlyWearingProps) {
	const [showEmotes] = useFeatureValue("viewUserEquippedEmotes", false);
	const [separateAnimations] = useFeatureValue(
		"improvedUserCurrentlyWearing.separateAnimationsTab",
		false,
	);
	const [showTotalValue] = useFeatureValue("improvedUserCurrentlyWearing.showTotalValue", false);

	const [activeTab, setActiveTab] = useState<ActiveTab>("assets");
	const [avatar] = usePromise(() => getUserAvatar({ userId }), [userId]);
	const [wearingAssetsIndex, setWearingAssetsIndex] = useState(0);
	const [purchaseDetails] = usePromise(() => {
		if (!avatar) return;

		const assetIds: number[] = [];
		if (!forEmotes)
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
	}, [avatar?.assets, avatar?.emotes, forEmotes]);

	const [wearingAssets, wearingAnimations, emotes, pageCount, totalValue] = useMemo(() => {
		if (!avatar) return [[], [], [], 1, 0];

		const assets: AssetWithDetails[] = [];
		const animations: AssetWithDetails[] = [];
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
							if (!item2.isIncluded) continue;

							assetIdToItem[item2.id] = item;
						}
				}
			}
		}

		if (!forEmotes)
			for (const item of avatar.assets) {
				const type = getAssetTypeData(item.assetType.id);

				const shouldInclude =
					!type?.isUsuallyTemplate && !RTHRO_ASSET_IDS.includes(item.id);

				const details = assetIdToItem[item.id];
				const newAsset = {
					...item,
					details,
					showBundle: shouldInclude,
				};
				if (
					type?.isAnimated &&
					type.assetType !== emoteAssetTypeName &&
					separateAnimations
				) {
					animations.push(newAsset);
				} else {
					assets.push(newAsset);
				}

				if (shouldInclude && details?.priceInRobux) {
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

			if (!forEmotes && details?.priceInRobux) {
				totalValueItems.add(details);
			}
		}

		let totalValue = 0;
		for (const item of totalValueItems) {
			totalValue += item.priceInRobux!;
		}

		return [
			assets.slice(wearingAssetsIndex * 8, (wearingAssetsIndex + 1) * 8),
			animations,
			emotes,
			Math.ceil(assets.length / 8),
			totalValue,
		];
	}, [wearingAssetsIndex, avatar?.assets, purchaseDetails, forEmotes, separateAnimations]);

	const tabs = useMemo(() => {
		const tabs = [{ id: "assets", label: getMessage("user.avatar.tabs.assets") }];

		if (!forEmotes && wearingAnimations.length && separateAnimations) {
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
	}, [forEmotes, emotes, wearingAnimations]);

	const containerHeaderRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (forEmotes) return;

		return watch<HTMLDivElement>("#profile-current-wearing-avatar .container-header", (el) => {
			containerHeaderRef.current = el;
		});
	}, [forEmotes, userId]);

	const content = (
		<>
			{!forEmotes &&
				showTotalValue &&
				containerHeaderRef.current &&
				createPortal(
					<span className="roseal-total-value">
						{getMessage("user.avatar.totalValue", {
							value: <RobuxView priceInRobux={totalValue} isForSale showZero />,
						})}
					</span>,
					containerHeaderRef.current,
				)}
			{tabs.length > 1 && (
				<PillToggle
					className="roseal-accoutrements-pill"
					items={tabs}
					onClick={(id) => setActiveTab(id as ActiveTab)}
					currentId={activeTab}
				/>
			)}
			{activeTab === "assets" && !forEmotes && (
				<div className="profile-accoutrements-container roseal-emotes-container">
					<div className="profile-accoutrements-slider">
						<ul className="accoutrement-items-container">
							{wearingAssets.map((asset) => (
								<UserProfileAccoutrementItem
									key={asset.id}
									assetId={asset.id}
									assetName={
										asset.details?.itemType === "Asset"
											? asset.details.name
											: undefined
									}
									details={asset.details}
									showBundle={asset.showBundle}
								/>
							))}
						</ul>
					</div>
					{pageCount > 1 && (
						<div className="profile-accoutrements-page-container">
							{new Array(pageCount).fill(0).map((_, index) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: fine, intentional
									key={index}
									className={classNames("profile-accoutrements-page", {
										"page-active": index === wearingAssetsIndex,
									})}
									onClick={() => setWearingAssetsIndex(index)}
								/>
							))}
						</div>
					)}
				</div>
			)}
			{activeTab === "animations" && separateAnimations && !forEmotes && (
				<div className="profile-accoutrements-container roseal-animations-container">
					<div className="profile-accoutrements-slider">
						<ul className="accoutrement-items-container">
							{wearingAnimations.map((asset) => (
								<UserProfileAccoutrementItem
									key={asset.id}
									assetId={asset.id}
									assetName={
										asset.details?.itemType === "Asset"
											? asset.details.name
											: undefined
									}
									details={asset.details}
									showBundle={asset.showBundle}
								/>
							))}
						</ul>
					</div>
				</div>
			)}
			{activeTab === "emotes" && showEmotes && (
				<div className="profile-accoutrements-container roseal-emotes-container">
					<div className="profile-accoutrements-slider">
						<ul className="accoutrement-items-container">
							{emotes.map((emote) => (
								<UserProfileAccoutrementItem
									key={emote.assetId}
									assetId={emote.assetId}
									assetName={emote.assetName}
									details={emote.details}
									showBundle={emote.showBundle}
								/>
							))}
						</ul>
					</div>
				</div>
			)}
		</>
	);

	if (forEmotes) {
		return emotes.length > 0 && content;
	}

	return (
		<div className="col-sm-6 section-content profile-avatar-right roseal-currently-wearing">
			<div className="profile-avatar-mask">{content}</div>
		</div>
	);
}

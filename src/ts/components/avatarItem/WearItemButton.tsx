import {
	type AvatarItemRequest,
	getAvatarItem,
	multigetAvatarItems,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import {
	getAuthenticatedUserAvatar,
	setWearingAssets,
} from "src/ts/helpers/requests/services/avatar";
import { useCallback } from "preact/hooks";
import {
	buildMetaForAsset,
	buildMetaForAssets,
	filterWornAssets,
	getAssetTypeData,
	insertAssetMetaIntoAssetList,
} from "src/ts/utils/itemTypes";
import useFeatureValue from "../hooks/useFeatureValue";
import { crossSort } from "src/ts/utils/objects";
import { success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type WearItemButtonProps = {
	itemType: MarketplaceItemType;
	itemId: number;
};

export default function WearItemButton({ itemId, itemType }: WearItemButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [unlockedLimitsEnabled] = useFeatureValue("avatarUnlockedAccessoryLimits", false);

	const [isOwned] = usePromise(
		() =>
			authenticatedUser &&
			userOwnsItem({
				itemType,
				itemId,
				userId: authenticatedUser.userId,
			}),
		[itemType, itemId, authenticatedUser?.userId],
	);

	const [details] = usePromise(
		() =>
			getAvatarItem({
				itemType,
				itemId,
			}),
		[itemType, itemId],
	);
	const [avatar] = usePromise(getAuthenticatedUserAvatar);
	const [isWearingItem] = usePromise(() => {
		if (!avatar) return;

		if (itemType === "Bundle" && details) {
			for (const item of details.bundledItems) {
				if (item.type === "Asset") {
					let contains = false;
					for (const item2 of avatar.assets) {
						if (item2.id === item.id) {
							contains = true;
							break;
						}
					}

					if (!contains) return false;
				}
			}
		} else if (itemType === "Asset") {
			for (const item of avatar.assets) {
				if (item.id === itemId) return true;
			}
		}

		return false;
	}, [avatar, itemId, itemType, details]);

	const toggleWearItem = useCallback(async () => {
		if (!details || !avatar) return;

		if (!isWearingItem) {
			let finalList = buildMetaForAssets(
				avatar.assets,
				true,
				crossSort(
					avatar.assets!.filter((item) => getAssetTypeData(item.assetType.id)?.isLayered),
					(a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0),
				),
			);

			if (details.itemType === "Asset") {
				const assetToWearWithMeta = buildMetaForAsset(
					{
						id: details.id,
						assetType: {
							id: details.assetType,
						},
					},
					finalList,
				);

				if (assetToWearWithMeta)
					finalList = insertAssetMetaIntoAssetList(assetToWearWithMeta, [
						assetToWearWithMeta,
						...finalList,
					]);
			} else {
				const request: AvatarItemRequest<"Asset">[] = [];
				for (const asset of details.bundledItems) {
					if (asset.type !== "Asset") continue;

					request.push({
						id: asset.id,
						itemType: "Asset",
					});
				}

				const bundledItemsData = await multigetAvatarItems({
					items: request,
				});

				for (const asset of bundledItemsData) {
					const assetToWearWithMeta = buildMetaForAsset(
						{
							id: asset.id,
							assetType: {
								id: asset.assetType,
							},
						},
						finalList,
					);

					if (assetToWearWithMeta)
						finalList = insertAssetMetaIntoAssetList(assetToWearWithMeta, [
							assetToWearWithMeta,
							...finalList,
						]);
				}
			}

			setWearingAssets({
				assets: filterWornAssets(finalList, unlockedLimitsEnabled).assets,
			})
				.then(() => success(getMessage("item.contextMenu.wearItem.success")))
				.catch(() => warning(getMessage("item.contextMenu.wearItem.error")));
		} else {
			for (let i = 0; i < avatar.assets.length; i++) {
				const item = avatar.assets[i];

				if (itemType === "Asset") {
					if (item.id === itemId) {
						avatar.assets.splice(i, 1);
						break;
					}
				} else {
					for (const item2 of details.bundledItems) {
						if (item2.id === item.id) {
							avatar.assets.splice(i, 1);
							i--;
						}
					}
				}
			}

			setWearingAssets({
				assets: avatar.assets,
			})
				.then(() => success(getMessage("item.contextMenu.takeOffItem.success")))
				.catch(() => warning(getMessage("item.contextMenu.takeOffItem.error")));
		}
	}, [details, isWearingItem, unlockedLimitsEnabled]);

	if (!isOwned) return null;

	return (
		<li id="toggle-avatar-li">
			<button
				type="button"
				id="toggle-avatar"
				className="rbx-context-menu-toggle-avatar"
				onClick={toggleWearItem}
			>
				{getMessage(`item.contextMenu.${isWearingItem ? "takeOffItem" : "wearItem"}`)}
			</button>
		</li>
	);
}

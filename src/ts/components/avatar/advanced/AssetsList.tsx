import classNames from "classnames";
import Fuse from "fuse.js";
import { useMemo, useState } from "preact/hooks";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import {
	type AvatarAssetDefinitionWithTypes,
	type AvatarRestrictions,
	type UserAvatar,
	setWearingAssets,
} from "src/ts/helpers/requests/services/avatar";
import {
	type ListedUserInventoryAsset,
	userOwnsItem,
} from "src/ts/helpers/requests/services/inventory";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import { listAllUserWearableInventoryAssets } from "src/ts/utils/assets";
import {
	buildMetaForAsset,
	buildMetaForAssets,
	filterWornAssets,
	getAssetTypeData,
	insertAssetMetaIntoAssetList,
} from "src/ts/utils/itemTypes";
import { crossSort } from "src/ts/utils/objects";
import ItemLookup from "../../core/ItemLookup";
import Loading from "../../core/Loading";
import { warning } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePromise from "../../hooks/usePromise";
import type { AdvancedWornAsset } from "../AdvancedCustomizationButton";
import WornAssetView from "./WornAssetView";
import AvatarAdvancedLimitView from "./LimitView";
import SearchedAssetResult from "./SearchedAssetResult";

export type AssetsListProps = {
	avatar: UserAvatar | undefined | null;
	avatarRules: AvatarRestrictions | null | undefined;
	avatarHasError?: boolean;
	setAvatar: (avatar: UserAvatar) => void;
	setAssetData: (asset: AdvancedWornAsset) => void;
	incrementRefreshId: () => void;
};

export function AssetsList({
	avatar,
	avatarRules,
	avatarHasError,
	setAssetData,
	incrementRefreshId,
	setAvatar,
}: AssetsListProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [unlockedLimitsEnabled] = useFeatureValue("avatarUnlockedAccessoryLimits", false);
	const [wornAssets, , wornAssetsError] = usePromise(
		() =>
			avatar?.assets &&
			multigetAvatarItems({
				items: avatar.assets.map((asset) => ({
					id: asset.id,
					itemType: "Asset",
				})),
			}).then((data2) => {
				return data2.map((asset) => ({
					name: asset.name,
					creator: {
						id: asset.creatorTargetId,
						type: asset.creatorType,
					},
					...avatar.assets.find((a) => a.id === asset.id)!,
				}));
			}),
		[avatar?.assets],
		false,
	);
	const [inventory] = usePromise(
		() => authenticatedUser && listAllUserWearableInventoryAssets(authenticatedUser.userId),
		[authenticatedUser?.userId],
	);

	const [isUpdating, setIsUpdating] = useState(false);
	const [addErrorMessage, setAddErrorMessage] = useState("");
	const [keyword, setKeyword] = useState("");

	const match = useMemo(
		() => inventory && new Fuse(inventory, { keys: ["name"], shouldSort: true }),
		[inventory],
	);
	const results = useMemo(() => {
		if (!match || !wornAssets || !keyword) {
			return;
		}

		const filteredAssets: ListedUserInventoryAsset[] = [];
		const matchedAssets = match.search(keyword);

		for (const item of matchedAssets) {
			const asset = item.item;
			const typeData = getAssetTypeData(asset.assetType);

			if (
				typeData &&
				filterWornAssets(
					[
						{
							assetType: {
								name: asset.assetType,
								id: typeData.assetTypeId,
							},
							id: asset.assetId,
						},
						...wornAssets,
					],
					unlockedLimitsEnabled,
				).assets.length > wornAssets.length
			) {
				filteredAssets.push(asset);

				if (filteredAssets.length >= 10) {
					break;
				}
			}
		}

		return filteredAssets;
	}, [inventory, wornAssets, keyword, unlockedLimitsEnabled]);

	const { itemsAtLimit, canAddMore, limits } = useMemo(() => {
		const itemsAtLimit = new Set<number>();
		if (!wornAssets) {
			return {
				canAddMore: false,
				itemsAtLimit: itemsAtLimit,
				limits: [],
			};
		}
		const filteredAssets = filterWornAssets(wornAssets!, unlockedLimitsEnabled);

		for (const item of wornAssets) {
			if (!filteredAssets.assets.some((item2) => item2.id === item.id)) {
				itemsAtLimit.add(item.id);
			}
		}

		return {
			canAddMore: itemsAtLimit.size === 0,
			limits: filteredAssets.limits,
			itemsAtLimit,
		};
	}, [wornAssets, unlockedLimitsEnabled]);

	const setWornAssets = (assets: AvatarAssetDefinitionWithTypes[]) => {
		if (avatar)
			setAvatar({
				...avatar,
				assets,
			});
	};

	const addAssetToAvatar = (assetToWear: AdvancedWornAsset, skipCheck = false) => {
		if (!avatar) {
			return;
		}

		if (!skipCheck) {
			const filteredAssets = filterWornAssets(
				[assetToWear, ...wornAssets!],
				unlockedLimitsEnabled,
			);
			if (filteredAssets.assets.length <= wornAssets!.length) {
				const conflictingAssets = wornAssets!.filter(
					(item) => !filteredAssets.assets.some((item2) => item2.id === item.id),
				);

				if (conflictingAssets.length === 0) {
					setAddErrorMessage(getMessage("avatar.advanced.assets.errors.alreadyWearing"));
					setIsUpdating(false);
					return;
				}

				return setAddErrorMessage(
					getMessage("avatar.advanced.assets.errors.addConflict", {
						assetNames: unitListFormat.format(
							conflictingAssets.map((asset) => asset.name),
						),
					}),
				);
			}
		}

		const currentAssets = buildMetaForAssets(
			wornAssets!,
			true,
			crossSort(
				wornAssets!.filter((item) => getAssetTypeData(item.assetType.id)?.isLayered),
				(a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0),
			),
		);

		const assetToWearWithMeta = buildMetaForAsset(assetToWear, currentAssets, true);

		if (!assetToWearWithMeta) {
			return;
		}

		const finalList = insertAssetMetaIntoAssetList(assetToWearWithMeta, [
			assetToWearWithMeta,
			...currentAssets,
		]);

		setWearingAssets({
			assets: finalList,
		})
			.then((data) => {
				if (data.success) {
					incrementRefreshId();
					sendMessage("avatar.updateAssets", finalList);
					setWornAssets(finalList);
				} else {
					warning(getMessage("avatar.advanced.assets.errors.update"));
				}
			})
			.catch(() => warning(getMessage("avatar.advanced.assets.errors.update")))
			.finally(() => {
				setIsUpdating(false);
			});
	};

	const removeAssetFromAvatar = (assetId: number) => {
		if (!avatar || !wornAssets) {
			return;
		}

		const newAssets: AdvancedWornAsset[] = [];
		const layeredAccessories: AdvancedWornAsset[] = [];

		for (const item of wornAssets) {
			if (item.id === assetId) {
				continue;
			}

			newAssets.push(item);
			if (getAssetTypeData(item.assetType.id)?.isLayered) {
				layeredAccessories.push(item);
			}
		}

		crossSort(layeredAccessories, (a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0));

		const finalList = buildMetaForAssets(newAssets, true, layeredAccessories);

		setIsUpdating(true);
		setAddErrorMessage("");
		setWearingAssets({
			assets: finalList,
		})
			.then((data) => {
				if (data.success) {
					incrementRefreshId();
					sendMessage("avatar.updateAssets", finalList);
					setWornAssets(finalList);
				} else {
					warning(getMessage("avatar.advanced.assets.errors.remove"));
				}
			})
			.catch(() => warning(getMessage("avatar.advanced.assets.errors.remove")))
			.finally(() => {
				setIsUpdating(false);
			});
	};

	return (
		<div className="assets-list-container">
			<ItemLookup
				className="assets-lookup"
				items={results?.map((item) => ({
					...item,
					key: item.assetId,
				}))}
				onClick={async (item) => {
					setKeyword("");
					setIsUpdating(true);
					setAddErrorMessage("");

					return multigetAvatarItems({
						items: [
							{
								id: item.assetId,
								itemType: "Asset",
							},
						],
					}).then((details) => {
						if (!details[0]) {
							setIsUpdating(false);
							setAddErrorMessage(
								getMessage("avatar.advanced.assets.errors.fetchDetails"),
							);

							return;
						}

						return addAssetToAvatar(
							{
								id: item.assetId,
								name: item.name,
								assetType: {
									name: item.assetType,
									id: getAssetTypeData(item.assetType)!.assetTypeId,
								},
								creator: {
									id: details[0].creatorTargetId,
									type: details[0].creatorType,
								},
							},
							true,
						);
					});
				}}
				render={(item) => <SearchedAssetResult key={item.key} item={item} />}
				inputPlaceholder={getMessage(
					inventory
						? "avatar.advanced.assets.addAsset.byName"
						: "avatar.advanced.assets.addAsset.byId",
				)}
				inputClassName="asset-lookup-field"
				onType={(value) => {
					setKeyword(value);
				}}
				inputValue={keyword}
				inputDisabled={!canAddMore || isUpdating}
				onSubmit={(value) => {
					const assetId = Number.parseInt(value, 10);
					if (!assetId) {
						setAddErrorMessage(
							getMessage("avatar.advanced.assets.errors.invalidAssetId"),
						);
						return;
					}

					setKeyword("");

					setIsUpdating(true);
					setAddErrorMessage("");
					multigetAvatarItems({
						items: [
							{
								itemType: "Asset",
								id: assetId,
							},
						],
					})
						.then((data) => {
							const item = data[0];
							if (!item) {
								setAddErrorMessage(
									getMessage("avatar.advanced.assets.errors.assetNotFound"),
								);

								return;
							}

							return userOwnsItem({
								userId: authenticatedUser!.userId,
								itemType: "Asset",
								itemId: assetId,
							}).then((ownsItem) => {
								if (!ownsItem) {
									setAddErrorMessage(
										getMessage("avatar.advanced.assets.errors.assetNotOwned"),
									);
									return;
								}

								return addAssetToAvatar({
									name: item.name,
									assetType: {
										name: getAssetTypeData(item.assetType)?.assetType,
										id: item.assetType,
									},
									id: assetId,
									creator: {
										id: item.creatorTargetId,
										type: item.creatorType,
									},
								});
							});
						})
						.finally(() => {
							setIsUpdating(false);
						});
				}}
			>
				{addErrorMessage && <div className="text-error">{addErrorMessage}</div>}
			</ItemLookup>
			{limits.length !== 0 && (
				<div className="avatar-limits">
					{limits.map((limit) => (
						<AvatarAdvancedLimitView key={limit.type} limit={limit} />
					))}
				</div>
			)}
			{wornAssets?.length ? (
				<ul
					className={classNames("assets-list list-striped roseal-scrollbar", {
						"roseal-disabled": isUpdating,
					})}
				>
					{wornAssets.map((asset) => (
						<WornAssetView
							key={asset.id}
							asset={asset}
							avatarRules={avatarRules}
							itemsAtLimit={itemsAtLimit}
							setAssetData={setAssetData}
							removeAssetFromAvatar={removeAssetFromAvatar}
						/>
					))}
				</ul>
			) : wornAssets ? (
				<div className="assets-list-empty">
					{getMessage("avatar.advanced.assets.noWornAssets")}
				</div>
			) : avatarHasError || wornAssetsError ? (
				<div className="assets-list-empty">
					{getMessage("avatar.advanced.assets.errors.fetchAvatar")}
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
}

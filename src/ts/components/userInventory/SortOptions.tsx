import { useSignal } from "@preact/signals";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { addMessageListener, invokeMessage, sendMessage } from "src/ts/helpers/communication/dom";
import { watch } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	type SortOrder,
	deleteBadgeFromInventory,
	listUserBadges,
} from "src/ts/helpers/requests/services/badges";
import {
	deleteAssetFromInventory,
	listUserInventoryAssetsDetailed,
	listUserInventoryBundlesSubtype,
	type ListUserPlacesTab,
	listUserInventoryPlaces,
	listUserPasses,
	deletePassFromInventory,
	listUserPrivateServers,
	type ListUserPrivateServersTab,
} from "src/ts/helpers/requests/services/inventory";
import {
	multigetBundlesByIds,
	type AvatarBundleType,
} from "src/ts/helpers/requests/services/marketplace";
import type { InventoryCategoryData } from "src/ts/specials/handleInventorySorting";
import { getAssetTypeData, getBundleTypeData } from "src/ts/utils/itemTypes";
import {
	AVATAR_ITEM_REGEX,
	BADGE_DETAILS_REGEX,
	CREATOR_STORE_ASSET_REGEX,
	EXPERIENCE_DETAILS_REGEX,
	PASS_DETAILS_REGEX,
} from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";
import { getPathFromMaybeUrl } from "src/ts/utils/url";
import Button from "../core/Button";
import Dropdown from "../core/Dropdown";
import Loading from "../core/Loading";
import ItemDeletionCheckbox from "./ItemDeletionCheckbox";
import { loading, success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import {
	removeUserAssetFavorite,
	removeUserBundleFavorite,
} from "src/ts/helpers/requests/services/favorites";
import { storage } from "src/ts/helpers/storage";
import { ARCHIVED_ITEMS_STORAGE_KEY, type ArchivedItemsStorageValue } from "src/ts/constants/misc";
import useFeatureValue from "../hooks/useFeatureValue";
import { toggleArchiveItem } from "src/ts/utils/archivedItems";
import { getCorrectBundledItems } from "src/ts/utils/bundledItems";

export type UserInventorySortOptionsProps = {
	userId: number;
	isFavoritesPage: boolean;
	isViewingAuthenticatedUser: boolean;
};
export type InventoryItemTypeToDelete = "Badge" | "Pass" | "Bundle" | "Asset";

export type InventoryItemToDelete = {
	type: InventoryItemTypeToDelete;
	id: number;
};

export default function UserInventorySortOptions({
	userId,
	isFavoritesPage,
	isViewingAuthenticatedUser,
}: UserInventorySortOptionsProps) {
	const [archiveAvatarItemsEnabled] = useFeatureValue("avatarItemArchiveInInventory", false);

	const [categoryData, setCategoryData] = useState<InventoryCategoryData>();
	const [itemCount, setItemCount] = useState<number>();

	const [startedCounting, setStartCounting] = useState(false);

	const startedSelecting = useSignal(false);
	const itemsToDelete = useSignal(new Set<InventoryItemToDelete>());
	const startedDeleting = useSignal(false);

	const {
		isDeletingSupported,
		isArchivingSupported,
		isCountingSupported,
		isArchivedPage,
		isAvatarItem,
		hasGetMore,
		itemType,
		itemSubType,
	} = useMemo(() => {
		switch (categoryData?.category?.categoryType) {
			case "PrivateServers": {
				return {
					isDeletingSupported: false,
					isArchivingSupported: false,
					isCountingSupported:
						categoryData.subcategory?.filter !== "SharedPrivateServers" &&
						!isFavoritesPage,
					isArchivedPage: false,
					isAvatarItem: false,
					hasGetMore: false,
					itemType: categoryData.category.categoryType,
					itemSubType: categoryData?.subcategory?.categoryType,
				} as const;
			}
			case "Place": {
				return {
					isDeletingSupported: isFavoritesPage && isViewingAuthenticatedUser,
					isArchivingSupported: false,
					isCountingSupported: !isFavoritesPage,
					isArchivedPage: false,
					isAvatarItem: false,
					hasGetMore: false,
					itemType: categoryData.category.categoryType,
					itemSubType: categoryData?.subcategory?.categoryType,
				} as const;
			}

			case "Badge":
			case "GamePass": {
				return {
					isDeletingSupported: isViewingAuthenticatedUser,
					isArchivingSupported: false,
					isCountingSupported: !isFavoritesPage,
					isArchivedPage: false,
					isAvatarItem: false,
					hasGetMore: false,
					itemType: categoryData.category.categoryType,
				} as const;
			}

			case "Bundle":
			case "DynamicHead": {
				const bundleId = categoryData?.subcategory?.id;
				if (!bundleId)
					return {
						isDeletingSupported: false,
						isArchivingSupported: false,
						isCountingSupported: false,
						isArchivedPage: false,
						isAvatarItem: false,
						hasGetMore: true,
						itemType: "Bundle",
					};

				return {
					isDeletingSupported: false,
					isArchivingSupported: isViewingAuthenticatedUser,
					isCountingSupported: !isFavoritesPage,
					isArchivedPage: false,
					isAvatarItem: true,
					hasGetMore: true,
					itemType: "Bundle",
					itemSubType: getBundleTypeData(bundleId)?.bundleType as AvatarBundleType,
				} as const;
			}

			default: {
				const assetTypeId = categoryData?.subcategory?.id;
				if (!assetTypeId || categoryData.subcategory?.type !== "AssetType")
					return {
						isDeletingSupported: false,
						isArchivingSupported: false,
						isCountingSupported: false,
						isArchivedPage: false,
						isAvatarItem: false,
						hasGetMore: true,
						itemType: "Asset",
						assetTypeId,
					};

				const assetTypeData = getAssetTypeData(assetTypeId);
				const isArchivedPage = assetTypeId < 0;
				const isAvatarAsset = assetTypeData?.isAvatarAsset === true;

				return {
					isDeletingSupported:
						isViewingAuthenticatedUser &&
						(isFavoritesPage || assetTypeData?.isDeletable === true),
					isArchivingSupported:
						isViewingAuthenticatedUser &&
						(assetTypeData?.isAvatarAsset || isArchivedPage) &&
						archiveAvatarItemsEnabled,
					isCountingSupported: !isFavoritesPage && !isArchivedPage,
					isArchivedPage,
					isAvatarItem: isAvatarAsset,
					hasGetMore: isAvatarAsset || assetTypeData?.isCreatorMarketplaceAsset === true,
					itemType: "Asset",
					itemSubType: assetTypeId,
				} as const;
			}
		}
	}, [
		categoryData?.category,
		categoryData?.subcategory,
		isViewingAuthenticatedUser,
		archiveAvatarItemsEnabled,
	]);

	const sortDirectionOptions = useMemo(
		() => [
			{
				id: "Asc",
				value: "Asc",
				label: getMessage("userInventory.filters.obtained.Asc"),
			},
			{
				id: "Desc",
				value: "Desc",
				label: getMessage("userInventory.filters.obtained.Desc"),
			},
		],
		[],
	);

	const startDeletingText = useMemo(() => {
		const prefix = startedSelecting.value
			? itemsToDelete.value.size
				? isFavoritesPage
					? "removeItems"
					: isArchivedPage
						? "unarchiveItems"
						: isArchivingSupported
							? "archiveItems"
							: "deleteItems"
				: "cancelItems"
			: "selectItems";
		return getMessage(`userInventory.filters.${prefix}.buttonText`);
	}, [
		itemsToDelete.value,
		startedSelecting.value,
		isFavoritesPage,
		isArchivedPage,
		isArchivingSupported,
	]);

	const deleteSelectedItems = useCallback(() => {
		if (!isDeletingSupported && !isArchivingSupported) return;

		if (!startedSelecting.value) {
			startedSelecting.value = true;
			return;
		}

		const count = itemsToDelete.value.size;
		if (!count) {
			startedSelecting.value = false;
			return;
		}
		startedDeleting.value = true;

		if (isArchivingSupported) {
			if (!isArchivedPage)
				loading(
					getMessage("userInventory.filters.archiveItems.systemFeedback.loading", {
						totalCount: asLocaleString(count),
					}),
				);

			storage.get(ARCHIVED_ITEMS_STORAGE_KEY).then(async (data) => {
				const value = (data[ARCHIVED_ITEMS_STORAGE_KEY] ?? {
					items: [],
				}) as ArchivedItemsStorageValue;

				const bundleIds: number[] = [];

				let totalSuccess = 0;
				for (const item of itemsToDelete.value) {
					if (item.type === "Asset" || item.type === "Bundle") {
						if (item.type === "Bundle" && !isArchivedPage) {
							bundleIds.push(item.id);
						} else {
							totalSuccess++;
							toggleArchiveItem(
								value,
								{
									id: item.id,
									type: item.type,
								},
								isArchivedPage,
							);
						}
					}
				}

				if (bundleIds.length) {
					const data = await multigetBundlesByIds({
						bundleIds,
					});

					const promises: Promise<void>[] = [];
					for (const bundle of data) {
						promises.push(
							getCorrectBundledItems(
								bundle.name,
								bundle.creator.type,
								bundle.creator.id,
								bundle.items,
							).then((correctBundledItems) => {
								for (const item of correctBundledItems) {
									toggleArchiveItem(
										value,
										{
											id: item.id,
											type: item.type,
											bundleId: bundle.id,
										},
										false,
									);
								}

								toggleArchiveItem(
									value,
									{
										id: bundle.id,
										type: "Bundle",
									},
									isArchivedPage,
								);

								totalSuccess++;
							}),
						);
					}

					await Promise.allSettled(promises);
				}

				await storage.set({
					[ARCHIVED_ITEMS_STORAGE_KEY]: value,
				});

				if (!totalSuccess) {
					warning(
						getMessage(
							`userInventory.filters.${isArchivedPage ? "unarchiveItems" : "archiveItems"}.systemFeedback.warning`,
							{
								totalCount: asLocaleString(count),
							},
						),
					);
				} else if (totalSuccess === count) {
					success(
						getMessage(
							`userInventory.filters.${isArchivedPage ? "unarchiveItems" : "archiveItems"}.systemFeedback.success`,
							{
								totalCount: asLocaleString(count),
							},
						),
					);
				} else {
					success(
						getMessage(
							`userInventory.filters.${isArchivedPage ? "unarchiveItems" : "archiveItems"}.systemFeedback.successWithErrors`,
							{
								totalCount: asLocaleString(count),
								totalSuccessCount: asLocaleString(totalSuccess),
							},
						),
					);
				}

				startedDeleting.value = false;
				startedSelecting.value = false;
				itemsToDelete.value.clear();
				itemsToDelete.value = new Set(itemsToDelete.value);

				sendMessage("user.inventory.refreshInventory", undefined);
			});
			return;
		}

		loading(
			getMessage(
				`userInventory.filters.${isFavoritesPage ? "removeItems" : "deleteItems"}.systemFeedback.loading`,
				{
					totalCount: asLocaleString(count),
				},
			),
		);

		const promises: Promise<boolean>[] = [];
		for (const item of itemsToDelete.value) {
			if (isFavoritesPage) {
				if (item.type === "Bundle") {
					promises.push(
						removeUserBundleFavorite({
							userId,
							bundleId: item.id,
						})
							.then(() => true)
							.catch(() => false),
					);
				} else {
					promises.push(
						removeUserAssetFavorite({
							userId,
							assetId: item.id,
						})
							.then(() => true)
							.catch(() => false),
					);
				}
			} else if (item.type === "Asset") {
				promises.push(
					deleteAssetFromInventory({
						assetId: item.id,
					})
						.then(() => true)
						.catch(() => false),
				);
			} else if (item.type === "Badge") {
				promises.push(
					deleteBadgeFromInventory({
						badgeId: item.id,
					})
						.then(() => true)
						.catch(() => false),
				);
			} else if (item.type === "Pass") {
				promises.push(
					deletePassFromInventory({
						passId: item.id,
					})
						.then(() => true)
						.catch(() => false),
				);
			}
		}

		Promise.all(promises).then((successes) => {
			let totalFailures = 0;
			let totalSuccess = 0;
			for (const item of successes) {
				if (item) {
					totalSuccess++;
				} else {
					totalFailures++;
				}
			}

			if (!totalSuccess) {
				warning(
					getMessage(
						`userInventory.filters.${isFavoritesPage ? "removeItems" : "deleteItems"}.systemFeedback.warning`,
						{
							totalCount: asLocaleString(count),
						},
					),
				);
			} else if (!totalFailures) {
				success(
					getMessage(
						`userInventory.filters.${isFavoritesPage ? "removeItems" : "deleteItems"}.systemFeedback.success`,
						{
							totalCount: asLocaleString(count),
						},
					),
				);
			} else {
				success(
					getMessage(
						`userInventory.filters.${isFavoritesPage ? "removeItems" : "deleteItems"}.systemFeedback.successWithErrors`,
						{
							totalCount: asLocaleString(count),
							totalSuccessCount: asLocaleString(totalSuccess),
						},
					),
				);
			}

			if (!totalFailures) {
				itemsToDelete.value.clear();
				itemsToDelete.value = new Set(itemsToDelete.value);
				startedSelecting.value = false;
			}

			if (totalSuccess) {
				startedDeleting.value = false;

				setItemCount(undefined);
				sendMessage("user.inventory.refreshInventory", undefined);
			}
		});
	}, [isArchivedPage, isFavoritesPage, isDeletingSupported, isArchivingSupported]);
	const startCounting = useCallback(() => setStartCounting(true), []);

	useEffect(() => {
		invokeMessage("user.inventory.getCategoryData", undefined).then(setCategoryData);

		return addMessageListener("user.inventory.categoryChanged", (data) => {
			setCategoryData(data);
			setItemCount(undefined);
			setStartCounting(false);

			startedSelecting.value = false;
			itemsToDelete.value.clear();
			itemsToDelete.value = new Set(itemsToDelete.value);
		});
	}, []);

	useEffect(() => {
		if (!startedCounting) return;

		setItemCount(undefined);
		let stopped = false;
		const promises: Promise<void>[] = [];

		const ids = new Set<number>();
		const sortOrders: SortOrder[] =
			itemType === "Asset" || itemType === "Badge" ? ["Asc", "Desc"] : ["Desc"];
		let attempts = 20;

		for (const sortOrder of sortOrders) {
			promises.push(
				(async () => {
					let cursor: string | number | undefined;

					while (attempts > 0) {
						if (stopped) return;

						try {
							if (itemType === "Asset") {
								const data = await listUserInventoryAssetsDetailed({
									userId,
									assetTypeId: itemSubType!,
									limit: 100,
									sortOrder,
									cursor: cursor as string,
								});

								let shouldExit = false;
								for (const item of data.data) {
									if (ids.has(item.assetId)) {
										shouldExit = true;
									} else {
										ids.add(item.assetId);
									}
								}

								if (shouldExit || !data.nextPageCursor) {
									break;
								}

								cursor = data.nextPageCursor;
							} else if (itemType === "Badge") {
								const data = await listUserBadges({
									userId,
									limit: 100,
									sortOrder,
									cursor: cursor as string,
								});

								let shouldExit = false;
								for (const item of data.data) {
									if (ids.has(item.id)) {
										shouldExit = true;
									} else {
										ids.add(item.id);
									}
								}

								if (shouldExit || !data.nextPageCursor) {
									break;
								}

								cursor = data.nextPageCursor;
							} else if (itemType === "Bundle") {
								const data = await listUserInventoryBundlesSubtype({
									userId,
									subtype: itemSubType!,
									limit: 100,
									cursor: cursor as string,
								});

								for (const item of data.data) {
									ids.add(item.id);
								}

								if (!data.nextPageCursor) {
									break;
								}

								cursor = data.nextPageCursor;
							} else if (itemType === "GamePass") {
								const data = await listUserPasses({
									userId,
									count: 101,
									exclusiveStartId: cursor as number,
								});

								if (!data.gamePasses.length) {
									break;
								}

								for (const item of data.gamePasses) {
									ids.add(item.gamePassId);
								}

								cursor = data.gamePasses.at(-1)?.gamePassId;
							} else if (itemType === "Place") {
								const data = await listUserInventoryPlaces({
									userId,
									placesTab: itemSubType as ListUserPlacesTab,
									itemsPerPage: 100,
									cursor: cursor as string,
								});

								for (const item of data.data) {
									ids.add(item.placeId);
								}

								if (!data.nextPageCursor) {
									break;
								}

								cursor = data.nextPageCursor;
							} else if (itemType === "PrivateServers") {
								const data = await listUserPrivateServers({
									privateServersTab: itemSubType as ListUserPrivateServersTab,
									itemsPerPage: 100,
									cursor: cursor as string,
								});

								for (const item of data.data) {
									ids.add(item.placeId);
								}

								if (!data.nextPageCursor) {
									break;
								}

								cursor = data.nextPageCursor;
							} else {
								break;
							}

							attempts = 20;
						} catch {
							attempts--;
						}

						setItemCount(ids.size);
					}

					if (attempts === 0) {
						warning(
							getMessage("userInventory.filters.countItems.systemFeedback.error"),
						);
					}
				})(),
			);
		}

		Promise.all(promises).then(() => {
			if (stopped) return;

			setStartCounting(false);
			setItemCount(ids.size);
		});
		return () => {
			stopped = true;
		};
	}, [startedCounting]);

	useEffect(() => {
		if (!isDeletingSupported && !isArchivingSupported) return;

		return watch<HTMLAnchorElement>("#assetsItems .item-card-link", (cardLink) => {
			if (!cardLink.href) return;

			const itemPath = getPathFromMaybeUrl(cardLink.href).realPath;

			const thumbnailContainer = cardLink.querySelector<HTMLDivElement>(
				".item-card-thumb-container",
			);

			if (!thumbnailContainer) return;

			let newItemId: number | undefined;
			let newItemType: InventoryItemTypeToDelete | undefined;

			switch (itemType) {
				case "Asset":
				case "Bundle": {
					const avatarItemMatch = AVATAR_ITEM_REGEX.exec(itemPath);

					newItemType = avatarItemMatch?.[1] === "bundles" ? "Bundle" : "Asset";
					if (!avatarItemMatch) {
						const storeItemMatch = CREATOR_STORE_ASSET_REGEX.exec(itemPath);
						if (!storeItemMatch) return;

						newItemId = Number.parseInt(storeItemMatch[1], 10);
						break;
					}

					newItemId = Number.parseInt(avatarItemMatch[2], 10);
					break;
				}

				case "Badge": {
					const badgeMatch = BADGE_DETAILS_REGEX.exec(itemPath);
					if (!badgeMatch) {
						return;
					}

					newItemType = "Badge";
					newItemId = Number.parseInt(badgeMatch[1], 10);
					break;
				}
				case "GamePass": {
					const passMatch = PASS_DETAILS_REGEX.exec(itemPath);
					if (!passMatch) {
						return;
					}

					newItemType = "Pass";
					newItemId = Number.parseInt(passMatch[1], 10);
					break;
				}

				case "Place": {
					const placeMatch = EXPERIENCE_DETAILS_REGEX.exec(itemPath);
					if (!placeMatch) {
						return;
					}

					newItemType = "Asset";
					newItemId = Number.parseInt(placeMatch[1], 10);
					break;
				}

				default: {
					return;
				}
			}

			renderAppend(
				<ItemDeletionCheckbox
					itemType={newItemType}
					itemId={newItemId}
					itemsToDelete={itemsToDelete}
					startedDeleting={startedDeleting}
					startedSelecting={startedSelecting}
				/>,
				thumbnailContainer,
			);
		});
	}, [isDeletingSupported, isArchivingSupported, isAvatarItem]);

	if (!categoryData?.canView) return null;

	return (
		<div className="roseal-sort-options">
			{categoryData.hasSortDirection && (
				<Dropdown
					selectionItems={sortDirectionOptions}
					selectedItemValue={categoryData.sortDirection}
					onSelect={(sortDirection) => {
						sendMessage("user.inventory.setSortDirection", sortDirection as SortOrder);
						setCategoryData({
							...categoryData,
							sortDirection: sortDirection as SortOrder,
						});
					}}
					className="sort-direction-dropdown"
				/>
			)}
			<div
				className={classNames("delete-count-container", {
					"first-line": !hasGetMore,
				})}
			>
				{(isDeletingSupported || isArchivingSupported) && (
					<Button
						type={itemsToDelete.value.size > 0 ? "alert" : "control"}
						onClick={deleteSelectedItems}
						disabled={startedDeleting.value}
						className="delete-items-btn"
					>
						{startedDeleting.value ? (
							<Loading size="sm" className="loading-btn" />
						) : (
							startDeletingText
						)}
					</Button>
				)}
				{isCountingSupported && (
					<div className="count-items-container">
						<Button
							type="control"
							onClick={startCounting}
							disabled={startedCounting}
							className="count-items-btn"
						>
							{startedCounting ? (
								<Loading size="sm" className="loading-btn" />
							) : (
								getMessage("userInventory.filters.countItems.buttonText")
							)}
						</Button>
						{itemCount !== undefined && (
							<span className="total-items-count font-bold">
								{getMessage("userInventory.filters.countItems.totalItems", {
									totalCount: asLocaleString(itemCount),
								})}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

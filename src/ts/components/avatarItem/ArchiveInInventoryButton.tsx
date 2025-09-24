import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useCallback, useMemo } from "preact/hooks";
import {
	multigetBundlesByIds,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import useStorage from "../hooks/useStorage";
import { ARCHIVED_ITEMS_STORAGE_KEY, type ArchivedItemsStorageValue } from "src/ts/constants/misc";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import usePromise from "../hooks/usePromise";
import { toggleArchiveItem } from "src/ts/utils/archivedItems";
import { getCorrectBundledItems } from "src/ts/utils/bundledItems";
import { success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";

export type ArchiveInInventoryButtonProps = {
	itemId: number;
	itemType: MarketplaceItemType;
};

export default function ArchiveInInventoryButton({
	itemId,
	itemType,
}: ArchiveInInventoryButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [hasInstance] = usePromise(
		() =>
			authenticatedUser &&
			userOwnsItem({
				userId: authenticatedUser.userId,
				itemType,
				itemId,
			}),
		[itemType, itemId, authenticatedUser?.userId],
	);

	const [storageValue, setStorageValue, storageRef] = useStorage<ArchivedItemsStorageValue>(
		ARCHIVED_ITEMS_STORAGE_KEY,
		{
			items: [],
		},
	);
	const isArchived = useMemo(
		() => storageValue.items.some((item) => item.type === itemType && item.id === itemId),
		[storageValue.items, itemId, itemType],
	);

	const onClick = useCallback(
		async (e: MouseEvent) => {
			e.stopImmediatePropagation();

			try {
				if (!isArchived && itemType === "Bundle") {
					const bundleDetails = (
						await multigetBundlesByIds({
							bundleIds: [itemId],
						})
					)?.[0];
					if (bundleDetails) {
						const bundledItems = await getCorrectBundledItems(
							bundleDetails.name,
							bundleDetails.creator.type,
							bundleDetails.creator.id,
							bundleDetails.items,
						);
						for (const item of bundledItems) {
							toggleArchiveItem(
								storageRef.current,
								{
									id: item.id,
									type: item.type,
									bundleId: itemId,
								},
								false,
							);
						}

						toggleArchiveItem(
							storageRef.current,
							{
								id: itemId,
								type: "Bundle",
							},
							false,
						);
					}
				} else {
					toggleArchiveItem(
						storageRef.current,
						{
							id: itemId,
							type: itemType,
						},
						isArchived,
					);
				}

				await setStorageValue({
					...storageRef.current,
				});

				success(getMessage(`item.contextMenu.${isArchived ? "un" : ""}archive.success`));
			} catch {
				if (!isArchived) {
					warning(getMessage("item.contextMenu.archive.error"));
				}
			}
		},
		[isArchived, itemId, itemType],
	);

	if (!hasInstance) return null;

	return (
		<li id="roseal-archive-item-li">
			<button id="roseal-archive-item-btn" type="button" onClick={onClick}>
				{getMessage(`item.contextMenu.${isArchived ? "unarchive" : "archive"}`)}
			</button>
		</li>
	);
}

import type { ArchivedItemsItem, ArchivedItemsStorageValue } from "../constants/misc";

export function toggleArchiveItem(
	storageValue: ArchivedItemsStorageValue,
	item: ArchivedItemsItem,
	isArchived: boolean,
) {
	if (isArchived) {
		for (let i = 0; i < storageValue.items.length; i++) {
			const item2 = storageValue.items[i];

			if (
				(item2.type === item.type && item2.id === item.id) ||
				(item.type === "Bundle" && item2.bundleId === item.id)
			) {
				storageValue.items.splice(i, 1);

				if (item.type !== "Bundle") {
					break;
				}
				i--;
			}
		}
	} else {
		if (!storageValue.items.some((item2) => item.type === item2.type && item.id === item2.id))
			storageValue.items.unshift(item);
	}
}

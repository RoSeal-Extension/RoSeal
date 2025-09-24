import MdOutlineCheckBox from "@material-symbols/svg-400/outlined/check_box.svg";
import MdOutlineCheckBoxOutlineBlank from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg";
import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";
import type { InventoryItemToDelete, InventoryItemTypeToDelete } from "./SortOptions";

export type ItemDeletionCheckboxProps = {
	itemType: InventoryItemTypeToDelete;
	itemId: number;
	itemsToDelete: Signal<Set<InventoryItemToDelete>>;
	startedDeleting: Signal<boolean>;
	startedSelecting: Signal<boolean>;
};

export default function ItemDeletionCheckbox({
	itemType,
	itemId,
	itemsToDelete,
	startedDeleting,
	startedSelecting,
}: ItemDeletionCheckboxProps) {
	const isIncluded = useMemo(() => {
		for (const item of itemsToDelete.value) {
			if (item.type === itemType && item.id === itemId) {
				return true;
			}
		}

		return false;
	}, [itemsToDelete.value, itemType, itemId]);

	const toggleItem = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();

			const newSet = new Set(itemsToDelete.value);
			if (isIncluded) {
				for (const item of itemsToDelete.value) {
					if (item.type === itemType && item.id === itemId) {
						newSet.delete(item);
					}
				}
			} else {
				newSet.add({
					type: itemType,
					id: itemId,
				});
			}

			itemsToDelete.value = newSet;
		},
		[isIncluded, itemsToDelete.value, itemType, itemId],
	);

	if (!startedSelecting.value) return null;

	return (
		<button
			type="button"
			className="roseal-btn multi-delete-item-btn"
			onClick={toggleItem}
			disabled={startedDeleting.value}
		>
			{isIncluded ? (
				<MdOutlineCheckBox className="roseal-icon selected-icon" />
			) : (
				<MdOutlineCheckBoxOutlineBlank className="roseal-icon" />
			)}
		</button>
	);
}

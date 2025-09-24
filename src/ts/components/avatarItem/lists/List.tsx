import MdOutlineCheckBox from "@material-symbols/svg-400/outlined/check_box.svg";
import MdOutlineCheckBoxOutlineBlank from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg";
import classNames from "classnames";
import type {
	AvatarItemList,
	AvatarItemListGroup,
	AvatarItemListItemType,
	AvatarItemListsStorageValue,
} from "src/ts/constants/avatar";

export type AvatarItemListedListProps = {
	itemType: AvatarItemListItemType;
	itemId: number;
	list: AvatarItemList;
	group?: AvatarItemListGroup;
	groupIndex?: number;
	storageValue: AvatarItemListsStorageValue;
	index: number;
	setStorageValue: (value: AvatarItemListsStorageValue) => void;
};

export default function AvatarItemListedList({
	itemType,
	itemId,
	list,
	group,
	groupIndex,
	storageValue,
	index,
	setStorageValue,
}: AvatarItemListedListProps) {
	const addedIndex = list.items.findIndex((item) => item.id === itemId && item.type === itemType);
	const isAdded = addedIndex !== -1;

	return (
		<li className="list-item-container">
			<button
				type="button"
				className={classNames("roseal-btn list-item", {
					"is-added": isAdded,
				})}
				onClick={() => {
					const newItems = [...list.items];
					if (!isAdded) {
						newItems.push({
							id: itemId,
							type: itemType,
						});
					} else {
						newItems.splice(addedIndex, 1);
					}

					if (newItems.length === 0) {
						if (group) {
							group.items.splice(index, 1);

							if (group.items.length === 0) {
								storageValue.lists.splice(groupIndex!, 1);
							}

							if (
								storageValue.lists.length === 1 &&
								storageValue.lists[0].type === "Group" &&
								storageValue.lists[0].isDefault
							) {
								storageValue.lists = storageValue.lists[0].items;
							}
						} else {
							storageValue.lists.splice(index, 1);
						}
					} else {
						list.items = newItems;
					}

					setStorageValue({
						...storageValue,
					});
				}}
			>
				<div className="list-title text-overflow">{list.name}</div>
				<div
					className={classNames("list-add-icon", {
						"is-added": isAdded,
					})}
				>
					{isAdded ? (
						<MdOutlineCheckBox className="roseal-icon" />
					) : (
						<MdOutlineCheckBoxOutlineBlank className="roseal-icon" />
					)}
				</div>
			</button>
		</li>
	);
}

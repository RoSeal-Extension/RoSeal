import type { Signal } from "@preact/signals";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "../../core/modal/SimpleModal";
import useStorage from "../../hooks/useStorage";
import {
	AVATAR_ITEM_LISTS_STORAGE_KEY,
	type AvatarAnyExpandedItem,
	type AvatarExpandedListItem,
	type AvatarItemList,
	type AvatarItemListGroup,
	type AvatarItemListsStorageValue,
} from "src/ts/constants/avatar";
import { DndProvider, getBackendOptions, MultiBackend, Tree } from "@minoru/react-dnd-treeview";
import { useEffect, useMemo, useState } from "preact/hooks";
import classNames from "classnames";
import DNDItemList from "../itemLists/DNDItemList";
import DNDItemListGroup from "../itemLists/DNDItemListGroup";

export type EditItemListsModalProps = {
	show: Signal<boolean>;
};

export default function EditItemListsModal({ show }: EditItemListsModalProps) {
	const [storageValue, setStorageValue] = useStorage<AvatarItemListsStorageValue>(
		AVATAR_ITEM_LISTS_STORAGE_KEY,
		{
			lists: [],
		},
	);

	const [layout, setLayout] = useState<AvatarAnyExpandedItem[]>([]);

	const layoutTree = useMemo(() => {
		return layout?.map((item) => ({
			parent: item.parent,
			text: `${item.type.toLowerCase()} ${
				item.type === "Group"
					? (item.name ?? getMessage("avatar.itemTabs.unnamed"))
					: item.name
			}`,
			id: item.dndId,
			data: item,
		}));
	}, [layout]);

	const updateLayout = (layout: AvatarAnyExpandedItem[], shouldUpdateStorage = true) => {
		setLayout(layout);

		if (shouldUpdateStorage) {
			const newLayoutData: AvatarItemListsStorageValue["lists"] = [];
			const unsortedGroup: AvatarItemListGroup = {
				type: "Group",
				id: crypto.randomUUID(),
				name: "Unsorted",
				items: [],
				isDefault: true,
			};

			let hasGroup = false;
			for (const item of layout) {
				if (item.type === "Group") {
					hasGroup = true;
					break;
				}
			}

			for (const item of layout) {
				if (item.type === "List") {
					if (!hasGroup) {
						newLayoutData.push({
							type: "List",
							id: item.id,
							name: item.name,
							items: item.items,
						});
					} else if (item.parent === 0) {
						unsortedGroup.items.push({
							type: "List",
							id: item.id,
							name: item.name,
							items: item.items,
						});
					}
				} else {
					const groupItems: AvatarItemList[] = [];
					for (const item2 of layout) {
						if (item2.parent === item.dndId) {
							groupItems.push({
								type: "List",
								id: item2.id,
								name: item2.name,
								items: item2.items,
							});
						}
					}

					if (groupItems.length > 0)
						newLayoutData.push({
							type: "Group",
							id: item.id,
							name: item.name,
							items: groupItems,
							isDefault: item.isDefault,
						});
				}
			}

			if (unsortedGroup.items.length) {
				newLayoutData.push(unsortedGroup);
			}

			setStorageValue({
				lists: newLayoutData,
			});
		}
	};

	const transformIntoItem = (
		item: AvatarAnyExpandedItem,
		isDragging: boolean,
		isDropTarget: boolean,
	) => {
		const update = (data: Partial<AvatarAnyExpandedItem>) =>
			updateLayout(
				// @ts-expect-error: Fine, just partial stuff
				layout.map((item2) =>
					item2.dndId === item.dndId
						? {
								...item2,
								...data,
							}
						: item2,
				),
			);
		const deleteItem = () => {
			const newLayout = layout.filter((item2) => {
				return item2.dndId !== item.dndId;
			});

			for (let i = 0; i < newLayout.length; i++) {
				const item = newLayout[i];

				if (item.type === "Group") {
					let hasItems = false;
					for (const item2 of newLayout) {
						if (item2.type === "List" && item2.parent === item2.dndId) {
							hasItems = true;
							break;
						}
					}

					if (!hasItems) {
						newLayout.splice(i, 1);
						i--;
					}
				}
			}

			return updateLayout(newLayout);
		};

		const lists: AvatarExpandedListItem[] = [];
		for (const item2 of layout) {
			if (item2.type === "List" && item2.parent === item.dndId) {
				lists.push(item2);
			}
		}

		return (
			<div
				className={classNames("item", {
					"is-dragging": isDragging,
					"is-drop-target": isDropTarget,
				})}
			>
				{item.type === "Group" ? (
					<DNDItemListGroup name={item.name} updateGroup={update} />
				) : (
					<DNDItemList name={item.name} updateItem={update} deleteItem={deleteItem} />
				)}
			</div>
		);
	};

	useEffect(() => {
		const newLayout: AvatarAnyExpandedItem[] = [];
		for (const item of storageValue.lists) {
			if (item.type === "Group") {
				if (!item.isDefault)
					newLayout.push({
						type: "Group",
						dndId: `group-${item.id}`,
						id: item.id,
						name: item.name,
						parent: 0,
					});

				for (const item2 of item.items) {
					newLayout.push({
						type: "List",
						dndId: `list-${item2.id}`,
						id: item2.id,
						name: item2.name,
						parent: item.isDefault ? 0 : `group-${item.id}`,
						items: item2.items,
					});
				}
			} else {
				newLayout.push({
					type: "List",
					dndId: `list-${item.id}`,
					id: item.id,
					name: item.name,
					parent: 0,
					items: item.items,
				});
			}
		}

		updateLayout(newLayout, false);
	}, [storageValue.lists]);

	return (
		<SimpleModal
			title={getMessage("avatar.lists.modal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			subtitle={getMessage("avatar.lists.modal.subtitle")}
			show={show.value}
			size="sm"
			onClose={() => {
				show.value = false;
			}}
		>
			<div className="edit-item-lists-modal">
				<DndProvider backend={MultiBackend} options={getBackendOptions()}>
					<Tree
						classes={{
							placeholder: "drop-placeholder",
							root: "item-lists-layout rbx-scrollbar roseal-scrollbar",
							container: "group-items-container",
							listItem: "item-container",
						}}
						sort={false}
						tree={layoutTree}
						rootId={0}
						render={(node, { isDragging, isDropTarget, isOpen, onToggle }) => {
							if (!isOpen) onToggle();

							return transformIntoItem(node.data!, isDragging, isDropTarget);
						}}
						initialOpen
						onDrop={(data) => {
							const items: AvatarAnyExpandedItem[] = [];
							for (const item of data) {
								const itemData = item.data!;
								const parentId = item.parent ?? itemData.parent;

								// @ts-expect-error: Fine
								const newItemData: AvatarAnyExpandedItem = {
									...itemData,
									parent: parentId,
								};

								if (itemData.type === "Group") {
									items.push(newItemData);

									continue;
								}

								const itemItems: AvatarAnyExpandedItem[] = [];
								let parent: AvatarAnyExpandedItem | undefined;
								for (const item of data) {
									if (item.parent === newItemData.dndId) {
										itemItems.push(item.data!);
									}

									if (item.id === newItemData.parent) {
										parent = item.data!;
									}
								}

								if (parent?.type === "List") {
									continue;
								}

								if (itemItems.length >= 1) {
									const id = crypto.randomUUID();
									items.push(
										{
											type: "Group",
											id,
											dndId: `group-${id}`,
											parent: 0,
										},
										{
											...itemData,
											parent: `group-${id}`,
										},
									);

									for (const item of itemItems) {
										// @ts-expect-error: Fine
										items.push({
											...item,
											parent: `group-${id}`,
										});
									}

									continue;
								}

								items.push(newItemData);
							}

							updateLayout(
								items.filter(
									(item, index, arr) =>
										(item.type === "List" &&
											arr.findIndex((item2) => item.dndId === item2.dndId) ===
												index) ||
										arr.some((item2) => item2.parent === item.dndId),
								),
							);
						}}
						canDrop={(_, { dragSource, dropTarget }) => {
							if (!dragSource || !dropTarget) {
								return true;
							}

							return (
								dragSource.data?.type !== "Group" &&
								!dropTarget.parent &&
								dropTarget.id !== dragSource.id
							);
						}}
						placeholderRender={() => <div className="drop-placeholder-item" />}
					/>
				</DndProvider>
			</div>
		</SimpleModal>
	);
}

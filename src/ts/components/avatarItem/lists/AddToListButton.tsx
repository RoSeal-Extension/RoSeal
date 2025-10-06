import MdOutlineLibraryAddFilled from "@material-symbols/svg-400/outlined/library_add-fill.svg";
import MdOutlineLibraryAdd from "@material-symbols/svg-400/outlined/library_add.svg";
import MdOutlineLibraryAddCheckFilled from "@material-symbols/svg-400/outlined/library_add_check-fill.svg";
import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import {
	AVATAR_ITEM_LISTS_STORAGE_KEY,
	type AvatarItemListItemType,
	MAX_ITEM_LIST_NAME_LENGTH,
	type AvatarItemList,
	type AvatarItemListGroup,
	type AvatarItemListsStorageValue,
} from "src/ts/constants/avatar";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import Button from "../../core/Button";
import Popover from "../../core/Popover";
import TextInput from "../../core/TextInput";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import usePromise from "../../hooks/usePromise";
import useStorage from "../../hooks/useStorage";
import AvatarItemListedList from "./List";

export type AddToAvatarListButtonProps = {
	itemType: AvatarItemListItemType;
	itemId: number;
	isAvatarPage?: boolean;
	isOwnedOverride?: boolean;
};

export default function AddToAvatarListButton({
	itemType,
	itemId,
	isAvatarPage,
	isOwnedOverride,
}: AddToAvatarListButtonProps) {
	const [newListName, setNewListName] = useState("");
	const [storageValue, setStorageValue, isFetched] = useStorage<AvatarItemListsStorageValue>(
		AVATAR_ITEM_LISTS_STORAGE_KEY,
		{
			lists: [],
		},
	);
	const [authenticatedUser] = useAuthenticatedUser();
	const [isOwned] = usePromise(
		() =>
			isOwnedOverride ??
			(itemType === "UserOutfit" ||
				(authenticatedUser &&
					userOwnsItem({
						userId: authenticatedUser?.userId,
						itemType,
						itemId,
					}))),
		[itemType, itemId, authenticatedUser?.userId, isOwnedOverride],
	);

	const isAdded = useMemo(() => {
		if (!storageValue.lists.length) {
			return false;
		}

		for (const list of storageValue.lists) {
			if (list.type === "Group") {
				for (const list2 of list.items) {
					for (const item of list2.items) {
						if (item.id === itemId && item.type === itemType) {
							return true;
						}
					}
				}
			} else {
				for (const item of list.items) {
					if (item.id === itemId && item.type === itemType) {
						return true;
					}
				}
			}
		}

		return false;
	}, [storageValue.lists]);

	const createList = () => {
		if (!newListName.length) {
			return;
		}

		setNewListName("");
		let unsortedGroup: AvatarItemListGroup = {
			type: "Group",
			id: crypto.randomUUID(),
			name: "Unsorted",
			items: [],
			isDefault: true,
		};

		let unsortedGroupIsIn = false;
		let shouldUseUnsortedGroup = false;
		for (const item of storageValue.lists) {
			if (item.type === "Group") {
				shouldUseUnsortedGroup = true;

				if (item.isDefault) {
					unsortedGroupIsIn = true;
					unsortedGroup = item;
				}
			}
		}

		const itemToAdd: AvatarItemList = {
			type: "List",
			id: crypto.randomUUID(),
			name: newListName,
			items: [
				{
					type: itemType,
					id: itemId,
				},
			],
		};

		const newValue = storageValue.lists ?? [];
		if (shouldUseUnsortedGroup) {
			unsortedGroup.items.push(itemToAdd);

			if (!unsortedGroupIsIn) {
				newValue.push(unsortedGroup);
			}
		} else {
			newValue.push(itemToAdd);
		}

		setStorageValue({
			lists: newValue,
		});
	};

	return (
		(isAdded || isOwned || isOwnedOverride) && (
			<div
				className={classNames("item-toggle-list-button-container", {
					"is-added": isAdded,
					"is-avatar-page": isAvatarPage,
					disabled: !isFetched,
				})}
				onClick={(e) => {
					e.stopImmediatePropagation();
				}}
			>
				<Popover
					placement="bottom"
					trigger="click"
					button={
						<div className="toggle-list-button-container">
							<button
								type="button"
								className="btn-generic-more-sm toggle-list-button"
							>
								<div className="icon-variants">
									{isAdded ? (
										<MdOutlineLibraryAddCheckFilled className="roseal-icon regular-icon-added" />
									) : (
										<>
											<MdOutlineLibraryAdd className="roseal-icon regular-icon" />
											<MdOutlineLibraryAddFilled className="roseal-icon hover-icon" />
										</>
									)}
								</div>
								{!isAvatarPage && (
									<div className="icon-label">
										{getMessage(
											`avatarItem.addToList.buttonText.${isAdded ? "added" : "add"}`,
										)}
									</div>
								)}
							</button>
						</div>
					}
				>
					<div className="add-to-list-popover">
						<div className="container-header">
							<h4>{getMessage("avatarItem.addToList.title")}</h4>
							<p className="small">{getMessage("avatarItem.addToList.subtitle")}</p>
						</div>
						<div className="container-body">
							{storageValue.lists.length > 0 && (
								<ul className="lists roseal-scrollbar">
									{storageValue.lists.map((list, index) => {
										if (list.type === "Group") {
											return (
												<li
													className="grouped-lists-container"
													key={list.id}
												>
													<div className="group-list-name text-overflow">
														{list.isDefault
															? getMessage("avatar.itemTabs.unsorted")
															: (list.name ??
																getMessage(
																	"avatar.itemTabs.unnamed",
																))}
													</div>
													<ul className="lists roseal-scrollbar">
														{list.items.map((list2, index2) => {
															return (
																<AvatarItemListedList
																	key={list2.id}
																	index={index2}
																	list={list2}
																	group={list}
																	groupIndex={index}
																	itemType={itemType}
																	itemId={itemId}
																	storageValue={storageValue}
																	setStorageValue={
																		setStorageValue
																	}
																/>
															);
														})}
													</ul>
												</li>
											);
										}

										return (
											<AvatarItemListedList
												key={list.id}
												index={index}
												list={list}
												itemType={itemType}
												itemId={itemId}
												storageValue={storageValue}
												setStorageValue={setStorageValue}
											/>
										);
									})}
								</ul>
							)}
						</div>
						<div className="create-list-container">
							<div className="container-header">
								<span className="font-bold">
									{getMessage("avatarItem.addToList.createList.title")}
								</span>
							</div>
							<div className="list-name-container">
								<TextInput
									className="list-name-input"
									placeholder={getMessage(
										"avatarItem.addToList.createList.namePlaceholder",
									)}
									onEnter={createList}
									onType={setNewListName}
									value={newListName}
									minLength={1}
									maxLength={MAX_ITEM_LIST_NAME_LENGTH}
								/>
								<Button
									type="secondary"
									disabled={newListName.length === 0}
									onClick={createList}
								>
									{getMessage("avatarItem.addToList.createList.buttonText")}
								</Button>
							</div>
						</div>
					</div>
				</Popover>
			</div>
		)
	);
}

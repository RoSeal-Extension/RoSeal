import { useEffect, useState } from "preact/hooks";
import {
	MAX_ITEM_LIST_NAME_LENGTH,
	type AvatarItemList,
	type AvatarItemListGroup,
} from "src/ts/constants/avatar";
import IconButton from "../../core/IconButton";
import Popover from "../../core/Popover";
import TextInput from "../../core/TextInput";
import Button from "../../core/Button";
import type { RefObject } from "preact";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import classNames from "classnames";

export type EditItemPopupProps = {
	name: string;
	container: RefObject<HTMLDivElement>;
	updateItem:
		| ((data: Partial<AvatarItemList>) => void)
		| ((data: Partial<AvatarItemListGroup>) => void);
	deleteItem?: () => void;
};

export default function EditItemPopup({
	name,
	container,
	updateItem,
	deleteItem,
}: EditItemPopupProps) {
	const [newName, setNewName] = useState("");

	useEffect(() => setNewName(name), [name]);

	return (
		<Popover
			button={<IconButton iconType="generic" size="xs" iconName="edit" />}
			trigger="click"
			placement="left"
			container={container}
		>
			<div className="edit-item-list-popup">
				<div className="list-name-container">
					<TextInput
						placeholder={name}
						value={newName}
						onType={setNewName}
						onEnter={() =>
							updateItem({
								name: newName,
								isDefault: undefined,
							})
						}
						minLength={1}
						maxLength={MAX_ITEM_LIST_NAME_LENGTH}
					/>
				</div>
				<div
					className={classNames("list-btns-container", {
						"has-delete-btn": deleteItem,
					})}
				>
					{deleteItem && (
						<Button type="alert" onClick={deleteItem}>
							{getMessage("avatar.lists.modal.item.delete")}
						</Button>
					)}
					<Button
						type="primary"
						disabled={!newName || newName === name}
						onClick={() =>
							updateItem({
								name: newName,
							})
						}
					>
						{getMessage("avatar.lists.modal.item.update")}
					</Button>
				</div>
			</div>
		</Popover>
	);
}

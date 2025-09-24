import { useEffect, useState } from "preact/hooks";
import { addMessageListener, invokeMessage } from "src/ts/helpers/communication/dom";
import IconButton from "../core/IconButton";
import type { EditItemListsModalProps } from "./modals/EditItemListsModal";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function EditItemListsButton({ show }: EditItemListsModalProps) {
	const [isItemListsTab, setIsItemListsTab] = useState(false);

	useEffect(() => {
		invokeMessage("avatar.getHoveredTabName", undefined).then((name) =>
			setIsItemListsTab(name === "Lists"),
		);

		return addMessageListener("avatar.hoveredTabNameChanged", (name) =>
			setIsItemListsTab(name === "Lists"),
		);
	}, []);

	if (!isItemListsTab) return null;

	return (
		<IconButton
			iconName="edit"
			size="sm"
			onClick={() => {
				show.value = true;
			}}
			className="edit-item-lists-btn"
		>
			{getMessage("avatar.lists.buttonText")}
		</IconButton>
	);
}

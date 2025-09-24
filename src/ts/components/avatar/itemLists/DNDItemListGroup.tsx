import { useMemo, useRef } from "preact/hooks";
import type { AvatarExpandedGroupItem } from "src/ts/constants/avatar";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import EditItemPopup from "./EditItemPopup";

export type DNDItemListGroupProps = {
	name?: string;
	updateGroup: (data: Partial<AvatarExpandedGroupItem>) => void;
};

export default function DNDItemList({ name, updateGroup }: DNDItemListGroupProps) {
	const groupName = useMemo(() => name ?? getMessage("avatar.itemTabs.unnamed"), [name]);
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div className="item-list-group-item item-list-item" ref={ref}>
			<EditItemPopup name={groupName} updateItem={updateGroup} container={ref} />
			<div className="item-name">{groupName}</div>
		</div>
	);
}

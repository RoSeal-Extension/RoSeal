import { useRef } from "preact/hooks";
import type { AvatarItemList } from "src/ts/constants/avatar";
import EditItemPopup from "./EditItemPopup";

export type DNDItemListProps = {
	name: string;
	updateItem: (data: Partial<AvatarItemList>) => void;
	deleteItem: () => void;
};

export default function DNDItemList({ name, updateItem, deleteItem }: DNDItemListProps) {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div className="item-list-item" ref={ref}>
			<EditItemPopup
				name={name}
				updateItem={updateItem}
				deleteItem={deleteItem}
				container={ref}
			/>
			<div className="item-name">{name}</div>
		</div>
	);
}

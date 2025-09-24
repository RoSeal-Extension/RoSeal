import { sendMessage } from "src/ts/helpers/communication/dom";
import { BootstrapDropdown } from "../core/Dropdown";
import DropdownLabel from "../core/DropdownLabel";
import type { Signal } from "@preact/signals";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type FreeItemsVisibilityButtonProps = {
	showFreeItems: Signal<boolean>;
};

export default function FreeItemsVisibilityButton({
	showFreeItems,
}: FreeItemsVisibilityButtonProps) {
	const setShowFreeItems = (value: boolean) => {
		showFreeItems.value = value;
		sendMessage("transactions.setHideFreeItems", !value);
	};

	return (
		<DropdownLabel
			containerClassName="transactions-free-items-dropdown custom-transaction-type-dropdown"
			label={getMessage("transactions.saleType")}
			small
		>
			<BootstrapDropdown
				selectionItems={[
					{
						label: getMessage("transactions.saleType.allItems"),
						value: true,
					},
					{
						label: getMessage("transactions.saleType.limitedPaid"),
						value: false,
					},
				]}
				fitContent={false}
				selectedItemValue={showFreeItems.value}
				onSelect={(value) => {
					setShowFreeItems(value);
				}}
			/>
		</DropdownLabel>
	);
}

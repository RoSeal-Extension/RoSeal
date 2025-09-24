import type { Signal } from "@preact/signals";
import { useCallback } from "preact/hooks";
import { TRANSACTION_PAGE_SIZES } from "src/ts/constants/misc";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { BootstrapDropdown } from "../core/Dropdown";
import DropdownLabel from "../core/DropdownLabel";

export type PageSizeButtonProps = {
	pageSize: Signal<number>;
};

export default function PageSizeButton({ pageSize }: PageSizeButtonProps) {
	const setPageSize = useCallback((value: number) => {
		pageSize.value = value;
		sendMessage("transactions.setPageSize", value);
	}, []);

	return (
		<DropdownLabel
			containerClassName="transactions-free-items-dropdown custom-transaction-type-dropdown"
			label={getMessage("transactions.pageSize")}
			small
		>
			<BootstrapDropdown
				selectionItems={TRANSACTION_PAGE_SIZES.map((size) => ({
					label: getMessage("transactions.pageSize.value", {
						amount: asLocaleString(size),
					}),
					value: size,
				}))}
				fitContent={false}
				selectedItemValue={pageSize.value}
				onSelect={setPageSize}
			/>
		</DropdownLabel>
	);
}

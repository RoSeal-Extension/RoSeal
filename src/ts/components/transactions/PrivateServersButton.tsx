import type { Signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { BootstrapDropdown } from "../core/Dropdown";
import DropdownLabel from "../core/DropdownLabel";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type PrivateServersVisibilityButtonProps = {
	showPrivateServers: Signal<boolean>;
	navState?: Signal<[string, string?, string?, string?]>;
	updateNav?: (value?: string) => void;
};

export default function PrivateServersVisibilityButton({
	showPrivateServers,
	navState,
	updateNav,
}: PrivateServersVisibilityButtonProps) {
	const setShowPrivateServers = (value: boolean) => {
		showPrivateServers.value = value;
		updateNav?.(value ? undefined : "HidePrivateServers");
		sendMessage("transactions.setHidePrivateServers", !value);
	};

	useEffect(() => {
		if (navState) {
			setShowPrivateServers(navState.value[3] !== "HidePrivateServers");
		}
	}, [navState?.value[3]]);

	return (
		<DropdownLabel
			containerClassName="transactions-private-servers-dropdown custom-transaction-type-dropdown"
			label={getMessage("transactions.privateServersVisibility")}
			small
		>
			<BootstrapDropdown
				selectionItems={[
					{
						label: getMessage("transactions.privateServersVisibility.shown"),
						value: true,
					},
					{
						label: getMessage("transactions.privateServersVisibility.hidden"),
						value: false,
					},
				]}
				fitContent={false}
				selectedItemValue={showPrivateServers.value}
				onSelect={(value) => {
					setShowPrivateServers(value);
				}}
			/>
		</DropdownLabel>
	);
}

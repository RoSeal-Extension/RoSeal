import classNames from "classnames";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";

export type InventoryItemObtainedDateProps = {
	time: string;
	type: "Item" | "Badge";
	showOnHover: boolean;
};

export default function InventoryItemObtainedDate({
	showOnHover,
	time,
	type,
}: InventoryItemObtainedDateProps) {
	const displayMessage = useMemo(() => {
		if (!showOnHover) {
			return getAbsoluteTime(time);
		}

		switch (type) {
			case "Badge":
				return getMessage("userInventory.list.item.awarded", {
					time: getAbsoluteTime(time),
				});
			case "Item":
				return getMessage("userInventory.list.item.obtained", {
					time: getAbsoluteTime(time),
				});
		}
	}, [showOnHover, time, type]);

	return (
		<span
			className={classNames("xsmall text item-obtained-date", {
				"show-on-hover": showOnHover,
			})}
		>
			{displayMessage}
		</span>
	);
}

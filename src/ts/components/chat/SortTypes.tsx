import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import { CHAT_SORT_TYPES } from "src/ts/constants/misc";
import { invokeMessage, sendMessage } from "src/ts/helpers/communication/dom.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import Dropdown from "../core/Dropdown";
import DropdownLabel from "../core/DropdownLabel";
import usePromise from "../hooks/usePromise";

export default function ChatSortTypes() {
	const [isReady] = usePromise(
		() => invokeMessage("chat.setupSortTypes", undefined).then(() => true),
		[],
	);
	const [sortType, setSortType] = useState<(typeof CHAT_SORT_TYPES)[number]>(CHAT_SORT_TYPES[0]);
	const sortTypes = useMemo(
		() =>
			CHAT_SORT_TYPES.map((sortType) => ({
				id: sortType,
				value: sortType,
				label: getMessage(`chat.sorts.sortBy.values.${sortType}`),
			})),
		[],
	);

	return (
		<DropdownLabel containerId="chat-sort-filter" label={getMessage("chat.sorts.sortBy")}>
			<Dropdown
				selectionItems={sortTypes}
				selectedItemValue={sortType}
				className={classNames({
					disabled: !isReady,
				})}
				onSelect={(value) => {
					setSortType(value);
					sendMessage("chat.updateSortType", value);
				}}
			/>
		</DropdownLabel>
	);
}

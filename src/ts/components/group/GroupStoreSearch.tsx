import type { Signal } from "@preact/signals";
import { useState } from "preact/hooks";
import { invokeMessage } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Icon from "../core/Icon";
import TextInput from "../core/TextInput";
import usePromise from "../hooks/usePromise";

export type GroupStoreSearchProps = {
	groupId: Signal<number>;
};

export default function GroupStoreSearch({ groupId }: GroupStoreSearchProps) {
	const [disabled, setDisabled] = useState(false);
	const [canSearch] = usePromise(() => {
		return invokeMessage("group.store.canSearch", undefined);
	}, [groupId.value]);

	return (
		<div className="keyword-search-input">
			{canSearch && (
				<div className="input-group">
					<TextInput
						disabled={disabled}
						onChange={(value) => {
							setDisabled(true);
							invokeMessage("group.store.setSearchQuery", value).then(() =>
								setDisabled(false),
							);
						}}
						placeholder={getMessage("group.store.searchPlaceholder")}
					/>
					<div className="input-group-btn">
						<button type="button" className="input-addon-btn">
							<Icon name="search" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

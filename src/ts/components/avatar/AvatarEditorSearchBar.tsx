import type { Signal } from "@preact/signals";
import TextInput from "../core/TextInput";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useEffect, useState } from "preact/hooks";
import { watchAttributes, watchOnce } from "src/ts/helpers/elements";
import classNames from "classnames";

export type AvatarEditorSearchBarProps = {
	keyword: Signal<string>;
};

function determineCanShow() {
	const active = document.body.querySelector(
		"#avatar-react-container .rbx-tab-content > .tab-pane.active",
	);

	if (!active) return [false, false] as [boolean, boolean];

	return [
		active.id !== "bodyColors" && active.id !== "scale",
		active.id === "costumes" || active.id === "clothing",
	] as [boolean, boolean];
}

export default function AvatarEditorSearchBar({ keyword }: AvatarEditorSearchBarProps) {
	const [[show, halfWidth], setShouldShow] = useState([true, false]);

	useEffect(() => {
		setShouldShow(determineCanShow());
		watchOnce("#avatar-react-container .rbx-tab-content").then((el) => {
			watchAttributes(
				el,
				(_, tab) => {
					if (tab.parentElement !== el) return;

					setShouldShow(determineCanShow());
				},
				["class"],
				false,
				true,
			);
		});
	}, []);

	if (!show) return null;

	return (
		<TextInput
			className={classNames("roseal-avatar-editor-search", {
				"half-width": halfWidth,
			})}
			onType={(value) => {
				keyword.value = value;
			}}
			value={keyword.value}
			placeholder={getMessage("avatar.filters.search.placeholder")}
		/>
	);
}

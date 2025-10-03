import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import { watchAttributes, watchOnce } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import TextInput from "../../core/TextInput";
import Icon from "../../core/Icon";
import { AVATAR_EDITOR_FILTERS_INITIAL_VALUE, type AvatarEditorFiltersValue } from "../constants";
import FiltersContainer from "../../core/filters/FiltersContainer";

export type AvatarEditorSearchProps = {
	filters: Signal<AvatarEditorFiltersValue>;
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

export default function AvatarEditorSearch({ filters }: AvatarEditorSearchProps) {
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
		<div
			className={classNames("roseal-search-filters", {
				"half-width": halfWidth,
			})}
		>
			<FiltersContainer
				filters={[
					{
						id: "creatorName",
						title: getMessage("avatar.filters.creatorName.label"),
						previewTitle: filters.value.creatorName
							? getMessage("avatar.filters.creatorName.previewLabel", {
									creatorName: filters.value.creatorName,
								})
							: getMessage("avatar.filters.creatorName.label"),
						type: "input",
						placeholder: getMessage("avatar.filters.creatorName.inputPlaceholder"),
						value: filters.value.creatorName,
						defaultValue: AVATAR_EDITOR_FILTERS_INITIAL_VALUE.creatorName,
					},
				]}
				applyFilterValue={(id, value) => {
					filters.value = {
						...filters.value,
						[id]: value,
					};
				}}
			/>
			<div className="input-group with-search-bar keyword-filter">
				<TextInput
					className="keyword-filter-input"
					onType={(value) => {
						filters.value = {
							...filters.value,
							keyword: value,
						};
					}}
					value={filters.value.keyword}
					placeholder={getMessage("avatar.filters.search.placeholder")}
				/>
				<div className="input-group-btn">
					<button className="input-addon-btn" type="button">
						<Icon name="search" />
					</button>
				</div>
			</div>
		</div>
	);
}

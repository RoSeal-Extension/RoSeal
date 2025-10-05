import type { RenderParams } from "@minoru/react-dnd-treeview";
import classNames from "classnames";
import { useRef, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import CheckboxField from "../../core/CheckboxField";
import { BootstrapDropdown } from "../../core/Dropdown";
import DropdownLabel from "../../core/DropdownLabel";
import IconButton from "../../core/IconButton";
import Popover from "../../core/Popover";
import TextInput from "../../core/TextInput";
import {
	ALLOWED_CUSTOMIZATION_TREATMENTS,
	MAX_PLAYLIST_NAME_LENGTH,
	type CustomHomePlaylist,
	type SortWithOverrides,
} from "./constants";
import { ACCURATE_TOPIC_HANDLING, type HomeSortingLayoutItemSort } from "./utils";
import MdOutlineArrowDropDown from "@material-symbols/svg-400/outlined/arrow_drop_down-fill.svg";
import MdOutlineArrowDropUp from "@material-symbols/svg-400/outlined/arrow_drop_up-fill.svg";

export type SortItemProps = {
	render: RenderParams;
	sort: SortWithOverrides;
	playlist?: CustomHomePlaylist;
	data: HomeSortingLayoutItemSort;
	text: string;
	updatePlaylist?: (playlist?: CustomHomePlaylist) => void;
	updateSort: (sort: SortWithOverrides) => void;
};

export default function SortItem({
	sort,
	render,
	playlist,
	data,
	text,
	updatePlaylist,
	updateSort,
}: SortItemProps) {
	const [newPlaylistName, setNewPlaylistName] = useState(playlist?.name || "");

	const canCustomize = ALLOWED_CUSTOMIZATION_TREATMENTS.includes(data.sort.treatmentType);
	const canCustomizeTreatmentType = data.sort.topicLayoutData?.componentType !== "EventTile";
	const canCustomizeOtherLayout = data.sort.topicLayoutData?.componentType === "GridTile";
	const containerRef = useRef<HTMLDivElement>(null);

	const updatePlaylistName = () => {
		if (!playlist || !updatePlaylist) return;

		updatePlaylist({
			...playlist,
			name: newPlaylistName,
		});
	};

	const SortTextContainerType = playlist ? "button" : "div";

	return (
		<div
			ref={containerRef}
			className={classNames("sort-item", {
				"is-dragging": render.isDragging,
				"is-hidden": sort.override.hide,
				"is-open": render.isOpen,
			})}
		>
			<Popover
				container={containerRef}
				placement="left"
				trigger="click"
				button={
					<IconButton
						iconName="edit"
						size="sm"
						className="customize-sort-btn"
						disabled={!canCustomize}
					/>
				}
			>
				<div className="customize-sort-modal">
					{playlist && (
						<div className="playlist-section-container">
							<div className="container-header">
								<h2>{getMessage("home.customizeLayout.modal.playlist")}</h2>
							</div>
							<div className="playlist-section">
								<div className="playlist-name-container">
									<label className="playlist-name-label text-label">
										{getMessage("home.customizeLayout.modal.playlist.name")}
									</label>
									<TextInput
										placeholder={playlist.name}
										value={newPlaylistName}
										onType={setNewPlaylistName}
										onEnter={updatePlaylistName}
										minLength={1}
										maxLength={MAX_PLAYLIST_NAME_LENGTH}
									/>
								</div>
								<div className="playlist-btns-container">
									<Button
										type="alert"
										onClick={() => {
											updatePlaylist?.();
										}}
									>
										{getMessage("home.customizeLayout.modal.playlist.delete")}
									</Button>
									<Button
										type="primary"
										disabled={
											!newPlaylistName || newPlaylistName === playlist.name
										}
										onClick={updatePlaylistName}
									>
										{getMessage(
											"home.customizeLayout.modal.playlist.name.save",
										)}
									</Button>
								</div>
							</div>
						</div>
					)}
					<div className="content-section-container">
						<div className="container-header">
							<h2>{getMessage("home.customizeLayout.modal.content")}</h2>
						</div>
						<div className="content-section">
							{data.sort.topicId in ACCURATE_TOPIC_HANDLING && (
								<CheckboxField
									className="accurate-field"
									checked={sort.override.accurate}
									onChange={(value) => {
										updateSort({
											...sort,
											override: {
												...sort.override,
												accurate: value,
											},
										});
									}}
								>
									<label className="checkbox-label text-label">
										{getMessage(
											`home.customizeLayout.modal.content.accurate.${
												data.sort
													.topicId as keyof typeof ACCURATE_TOPIC_HANDLING
											}`,
										)}
									</label>
								</CheckboxField>
							)}
							{(sort.override.collapse || data.totalIndexes > 1) && (
								<CheckboxField
									className="collapse-field"
									disabled={data.typeIndex !== 0}
									checked={sort.override.collapse}
									onChange={(value) => {
										updateSort({
											...sort,
											override: {
												...sort.override,
												collapse: value,
											},
										});
									}}
								>
									<label className="checkbox-label text-label">
										{getMessage("home.customizeLayout.modal.content.collapse")}
									</label>
								</CheckboxField>
							)}
							<CheckboxField
								className="hide-field"
								checked={sort.override.hide}
								onChange={(value) => {
									updateSort({
										...sort,
										override: {
											...sort.override,
											hide: value,
										},
									});
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage("home.customizeLayout.modal.content.hide")}
								</label>
							</CheckboxField>
							<CheckboxField
								className="shuffle-field"
								checked={sort.override.shuffle}
								onChange={(value) => {
									updateSort({
										...sort,
										override: {
											...sort.override,
											shuffle: value,
										},
									});
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage("home.customizeLayout.modal.content.shuffle")}
								</label>
							</CheckboxField>
						</div>
					</div>
					{canCustomizeTreatmentType && (
						<div className="style-section-container">
							<div className="container-header">
								<h2>{getMessage("home.customizeLayout.modal.style")}</h2>
							</div>
							<div className="style-section">
								<DropdownLabel
									containerClassName="treatment-type-select"
									label={getMessage("home.customizeLayout.modal.style.type")}
								>
									<BootstrapDropdown
										selectionItems={(
											["Carousel", "SortlessGrid", "_setByRoblox"] as const
										).map((value) => ({
											value,
											label: getMessage(
												`home.customizeLayout.modal.style.type.values.${value}`,
											),
										}))}
										selectedItemValue={
											sort.override.treatmentType || data.sort.treatmentType
										}
										onSelect={(value) => {
											updateSort({
												...sort,
												override: {
													...sort.override,
													treatmentType: value as Exclude<
														typeof value,
														"FriendCarousel"
													>,
												},
											});
										}}
									/>
								</DropdownLabel>
								<DropdownLabel
									containerClassName="component-type-select"
									label={getMessage(
										"home.customizeLayout.modal.style.displayType",
									)}
								>
									<BootstrapDropdown
										selectionItems={(
											[
												"_default",
												"AppGameTileNoMetadata",
												"GridTile",
												"_setByRoblox",
											] as const
										).map((value) => ({
											value,
											label: getMessage(
												`home.customizeLayout.modal.style.displayType.values.${value}`,
											),
										}))}
										selectedItemValue={
											sort.layoutOverride.componentType ||
											data.sort.topicLayoutData?.componentType ||
											"_default"
										}
										onSelect={(value) => {
											updateSort({
												...sort,
												layoutOverride: {
													...sort.layoutOverride,
													componentType: value,
												},
											});
										}}
									/>
								</DropdownLabel>
								<DropdownLabel
									containerClassName="hover-style-select"
									label={getMessage(
										"home.customizeLayout.modal.style.hoverStyle",
									)}
								>
									<BootstrapDropdown
										disabled={!canCustomizeOtherLayout}
										selectionItems={(
											["_default", "imageOverlay", "_setByRoblox"] as const
										).map((value) => ({
											value,
											label: getMessage(
												`home.customizeLayout.modal.style.hoverStyle.values.${value}`,
											),
										}))}
										selectedItemValue={
											sort.layoutOverride.hoverStyle ||
											data.sort.topicLayoutData?.hoverStyle ||
											"_default"
										}
										onSelect={(value) => {
											updateSort({
												...sort,
												layoutOverride: {
													...sort.layoutOverride,
													hoverStyle: value,
												},
											});
										}}
									/>
								</DropdownLabel>
								<DropdownLabel
									containerClassName="player-count-style-select"
									label={getMessage(
										"home.customizeLayout.modal.style.playerCount",
									)}
								>
									<BootstrapDropdown
										disabled={!canCustomizeOtherLayout}
										selectionItems={(
											[
												"_default",
												"Always",
												"Hover",
												"Footer",
												"_setByRoblox",
											] as const
										).map((value) => ({
											value,
											label: getMessage(
												`home.customizeLayout.modal.style.playerCount.values.${value}`,
											),
										}))}
										selectedItemValue={
											sort.layoutOverride.playerCountStyle ||
											data.sort.topicLayoutData?.playerCountStyle ||
											"_default"
										}
										onSelect={(value) => {
											updateSort({
												...sort,
												layoutOverride: {
													...sort.layoutOverride,
													playerCountStyle: value,
												},
											});
										}}
									/>
								</DropdownLabel>
								<DropdownLabel
									containerClassName="play-button-style-select"
									label={getMessage(
										"home.customizeLayout.modal.style.playButton",
									)}
								>
									<BootstrapDropdown
										disabled={!canCustomizeOtherLayout}
										selectionItems={(
											["Enabled", "Disabled", "_setByRoblox"] as const
										).map((value) => ({
											value,
											label: getMessage(
												`home.customizeLayout.modal.style.playButton.values.${value}`,
											),
										}))}
										selectedItemValue={
											sort.layoutOverride.playButtonStyle ||
											data.sort.topicLayoutData?.playButtonStyle ||
											"_setByRoblox"
										}
										onSelect={(value) => {
											updateSort({
												...sort,
												layoutOverride: {
													...sort.layoutOverride,
													playButtonStyle: value,
												},
											});
										}}
									/>
								</DropdownLabel>
							</div>
						</div>
					)}
				</div>
			</Popover>
			<SortTextContainerType
				type="button"
				className="roseal-btn sort-item-text text-overflow"
				onClick={playlist && render.onToggle}
			>
				<span className="sort-text text-overflow">
					{data?.typeIndex !== 0
						? getMessage("home.customizeLayout.modal.nameWithNumber", {
								name: text,
								number: data.typeIndex + 1,
							})
						: !text && data.sort.topicLayoutData?.componentType === "EventTile"
							? getMessage("home.customizeLayout.modal.eventTileName")
							: text}
				</span>
				{playlist && (
					<div className="expand-playlist-btn">
						{render.isOpen ? (
							<MdOutlineArrowDropUp className="roseal-icon" />
						) : (
							<MdOutlineArrowDropDown className="roseal-icon" />
						)}
					</div>
				)}
			</SortTextContainerType>
		</div>
	);
}

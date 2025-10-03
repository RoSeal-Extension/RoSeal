import MdOutlineCheckBox from "@material-symbols/svg-400/outlined/check_box.svg";
import MdOutlineCheckBoxOutlineBlank from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg";
import classNames from "classnames";
import { Fragment } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { hexToRgb, rgbToHex } from "src/ts/utils/colors";
import { clamp } from "src/ts/utils/misc";
import { compareArrays } from "src/ts/utils/objects";
import Button from "../../core/Button";
import Icon from "../../core/Icon";
import TextInput from "../../core/TextInput";
import Tooltip from "../Tooltip";
import type { ApplyFilterValueFn, ColorFilterWithCheckbox, FilterData } from "./FiltersContainer";

export type FilterProps<T extends FilterData> = {
	className?: string;
	filter: T;
	applyFilterValue: ApplyFilterValueFn<T>;
};

export default function Filter<T extends FilterData>({
	className,
	filter,
	applyFilterValue,
}: FilterProps<T>) {
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [value, setValue] = useState<T["value"]>(filter.value);
	const dropdownContainerRef = useRef<HTMLDivElement>(null);

	const closeAndResetDropdown = useCallback(() => {
		setValue(filter.value);
		setIsDropdownOpen(false);
	}, [filter.value]);

	useEffect(() => {
		const handleMouseClick = (e: MouseEvent) => {
			if (
				dropdownContainerRef.current &&
				e.target instanceof Node &&
				!dropdownContainerRef.current.contains(e.target)
			) {
				closeAndResetDropdown();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeAndResetDropdown();
			}
		};
		document.addEventListener("mousedown", handleMouseClick);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleMouseClick);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeAndResetDropdown]);

	useEffect(() => {
		setValue(filter.value);
	}, [filter.value]);

	/*
	I dont remember what this is for?
	const isDefaultValue = useMemo(() => {
		if (filter.type === "checkbox") {
			return compareArrays(value as number[], filter.defaultValue);
		}

		if (filter.type === "colorsWithCheckboxes") {
			return (value as ColorFilterWithCheckbox[]).every((filter2, index) => {
				return (
					compareArrays(filter.defaultValue[index].color, filter2.color) &&
					filter.defaultValue[index].enabled === filter2.enabled
				);
			});
		}

		return value === filter.defaultValue;
	}, [filter.value, filter.defaultValue]);*/

	const hasChanged = useMemo(() => {
		if (filter.type === "checkbox") {
			return !compareArrays(value as number[], filter.value);
		}

		if (filter.type === "colorsWithCheckboxes") {
			return (value as ColorFilterWithCheckbox[]).some((filter2, index) => {
				return (
					!compareArrays(filter.value[index].color, filter2.color) ||
					filter.value[index].enabled !== filter2.enabled
				);
			});
		}

		if (filter.type === "number") {
			return (
				(value as number[])[0] !== filter.value[0] ||
				(value as number[])[1] !== filter.value[1]
			);
		}

		return value !== filter.value;
	}, [value, filter.value]);

	return (
		<div ref={dropdownContainerRef} className={classNames("roseal-filter-item", className)}>
			<Button
				onClick={isDropdownOpen ? closeAndResetDropdown : () => setIsDropdownOpen(true)}
				type={isDropdownOpen ? "primary" : "secondary"}
				size="md"
				className="filter-select"
			>
				<span className="filter-display-text text-overflow">{filter.previewTitle}</span>
				<Icon name={isDropdownOpen ? "expand-arrow-selected" : "expand-arrow"} />
			</Button>
			{isDropdownOpen && (
				<div className="filters-modal-container">
					<div className="header-container">
						<h3>
							{filter.title}
							{filter.titleTooltip && (
								<Tooltip
									button={<Icon name="moreinfo" addSizeClass size="16x16" />}
								>
									{filter.titleTooltip}
								</Tooltip>
							)}
						</h3>
						<div>
							<button
								type="button"
								className="header-close-button"
								onClick={() => {
									setValue(filter.value);
									setIsDropdownOpen(false);
								}}
							>
								<Icon name="close" />
							</button>
						</div>
					</div>
					{filter.type === "number" ? (
						<div className="filter-input-container filter-options-container">
							<div className="filter-option">
								<span>{getMessage("charts.filters.fields.minimum")}</span>
								<TextInput
									type="number"
									value={(value as number[])[0] || ""}
									min={filter.min}
									max={filter.max}
									onType={(newValue) => {
										let num = Number.parseInt(newValue, 10);
										if (Number.isNaN(num)) {
											num = filter.defaultValue[0];
										}

										setValue([
											num &&
												clamp(
													num,
													filter.min,
													(value as number[])[1] || filter.max,
												),
											(value as number[])[1],
										]);
									}}
									placeholder={filter.min.toString()}
									step={1}
								/>
							</div>
							<div className="filter-option">
								<span>{getMessage("charts.filters.fields.maximum")}</span>
								<TextInput
									type="number"
									value={(value as number[])[1] || ""}
									min={filter.min}
									max={filter.max}
									onType={(newValue) => {
										let num = Number.parseInt(newValue, 10);
										if (Number.isNaN(num)) {
											num = filter.defaultValue[1];
										}

										setValue([
											(value as number[])[0],
											num &&
												clamp(
													num,
													(value as number[])[0] || filter.min,
													filter.max,
												),
										]);
									}}
									placeholder={filter.max.toString()}
									step={1}
								/>
							</div>
						</div>
					) : filter.type === "colorsWithCheckboxes" ? (
						<div className="filter-color-options-container filter-options-container">
							{filter.options.map((option, index) => {
								const data = (value as ColorFilterWithCheckbox[])[index];
								const colorHex = rgbToHex(data.color);

								return (
									<div
										className={classNames("filter-option", {
											"selected-option": data.enabled,
										})}
										key={option.label}
									>
										<div>
											<span className="filter-option-name">
												{option.label}
											</span>
										</div>
										<button
											type="button"
											className="roseal-btn"
											onClick={() => {
												const newValue = [
													...(value as ColorFilterWithCheckbox[]),
												];
												newValue[index] = {
													...data,
													enabled: !data.enabled,
												};
												setValue(newValue);
											}}
										>
											{data.enabled ? (
												<MdOutlineCheckBox className="roseal-icon" />
											) : (
												<MdOutlineCheckBoxOutlineBlank className="roseal-icon" />
											)}
										</button>
										<div className="roseal-color-group">
											<input
												className="roseal-color-input circular-input"
												type="color"
												value={colorHex}
												onChange={(e) => {
													const newValue = [
														...(value as ColorFilterWithCheckbox[]),
													];
													newValue[index] = {
														...data,
														color: hexToRgb(
															(e.target as HTMLInputElement).value,
														),
													};
													setValue(newValue);
												}}
											/>
										</div>
									</div>
								);
							})}
						</div>
					) : filter.type === "input" ? (
						<div className="filter-input-container filter-options-container">
							<button type="button" className="filter-option selected-option">
								<TextInput
									className="filter-input"
									placeholder={filter.placeholder}
									maxLength={filter.maxLength}
									onType={setValue}
									value={value as string}
								/>
							</button>
						</div>
					) : (
						<div
							className={classNames("filter-options-container", {
								"filter-multi-options-container": filter.type === "checkbox",
							})}
						>
							{filter.options.map((option, index) => {
								const isSelected =
									filter.type === "dropdown"
										? value === option.value
										: (value as unknown[]).includes(option.value);

								return (
									<Fragment key={option.value}>
										<button
											type="button"
											onClick={() => {
												if (filter.type === "checkbox") {
													if (isSelected) {
														setValue(
															(value as number[]).filter(
																(v) => v !== option.value,
															),
														);
													} else {
														// @ts-expect-error: Fine
														setValue([
															...(value as T["value"][]),
															option.value as T["value"],
														]);
													}
												} else {
													setValue(option.value);
												}
											}}
											className={classNames("filter-option", {
												"selected-option": isSelected,
											})}
										>
											<span>{option.label}</span>
											{filter.type === "checkbox" ? (
												isSelected ? (
													<MdOutlineCheckBox className="roseal-icon" />
												) : (
													<MdOutlineCheckBoxOutlineBlank className="roseal-icon" />
												)
											) : (
												<Icon
													name={
														isSelected
															? "radio-check-circle-filled"
															: "radio-check-circle"
													}
												/>
											)}
										</button>
										{index === 0 && filter.firstItemDivider && (
											<div className="filter-option-divider" />
										)}
									</Fragment>
								);
							})}
						</div>
					)}
					<div
						className={classNames("action-buttons-container", {
							"has-roseal-btn": filter.type === "number",
						})}
					>
						{filter.type === "number" && (
							<Button
								type="secondary"
								className="roseal-btn"
								size="xs"
								width="full"
								onClick={() => setValue(filter.defaultValue)}
								disabled={!hasChanged}
							>
								{getMessage("charts.filters.actions.resetToDefault")}
							</Button>
						)}
						<Button
							onClick={() => {
								applyFilterValue(filter.id, value);
								setIsDropdownOpen(false);
							}}
							type="primary"
							size="md"
							width="full"
							className="apply-button"
							disabled={!hasChanged}
						>
							{getMessage("charts.filters.actions.apply")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

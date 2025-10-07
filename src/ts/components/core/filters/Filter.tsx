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
import UserLookup from "../UserLookup";
import AgentMentionContainer from "../items/AgentMentionContainer";
import type { RequestedUser } from "src/ts/helpers/requests/services/users";

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

	const isDefaultValue = useMemo(() => {
		switch (filter.type) {
			case "checkbox": {
				return compareArrays(value as number[], filter.defaultValue);
			}
			case "colorsWithCheckboxes": {
				return (value as ColorFilterWithCheckbox[]).every((filter2, index) => {
					return (
						compareArrays(filter.defaultValue[index].color, filter2.color) &&
						filter.defaultValue[index].enabled === filter2.enabled
					);
				});
			}

			case "number": {
				return (
					(value as number[])[0] === filter.defaultValue[0] &&
					(value as number[])[1] === filter.defaultValue[1]
				);
			}
		}

		return value === filter.defaultValue;
	}, [value, filter.defaultValue]);

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
				<Icon
					className="selection-icon"
					name={isDropdownOpen ? "expand-arrow-selected" : "expand-arrow"}
				/>
			</Button>
			{isDropdownOpen && (
				<div
					className={classNames("filters-modal-container", {
						"no-fixed-width": filter.type === "user",
					})}
				>
					<div className="header-container">
						<h3>
							{filter.title}
							{filter.titleTooltip && (
								<Tooltip
									button={
										<Icon
											className="selection-icon"
											name="moreinfo"
											addSizeClass
											size="16x16"
										/>
									}
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
								<Icon className="selection-icon" name="close" />
							</button>
						</div>
					</div>
					{filter.type === "number" ? (
						<div className="filter-options-container filter-numbers-container">
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": isDefaultValue,
								})}
								onClick={() => setValue(filter.defaultValue)}
							>
								<span class="filter-option-name">{filter.defaultLabel}</span>
								<Icon
									className="selection-icon"
									name={
										isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
								/>
							</button>
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": !isDefaultValue,
								})}
								onClick={() => {
									if (hasChanged && isDefaultValue) {
										setValue(filter.value);
									}
								}}
							>
								<div className="number-min-max-container">
									<TextInput
										type="number"
										value={
											(value as number[])[0] ||
											(filter.value as number[])[0] ||
											""
										}
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
										placeholder={getMessage("charts.filters.fields.minimum")}
										step={1}
									/>

									<TextInput
										type="number"
										value={
											(value as number[])[1] ||
											(filter.value as number[])[1] ||
											""
										}
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
										placeholder={getMessage("charts.filters.fields.maximum")}
										step={1}
									/>
								</div>
								<Icon
									className="selection-icon"
									name={
										!isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
								/>
							</button>
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
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": isDefaultValue,
								})}
								onClick={() => setValue(filter.defaultValue)}
							>
								<span class="filter-option-name">{filter.defaultLabel}</span>
								<Icon
									className="selection-icon"
									name={
										isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
								/>
							</button>
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": !isDefaultValue,
								})}
								onClick={() => {
									if (hasChanged && isDefaultValue) {
										setValue(filter.value);
									}
								}}
							>
								<TextInput
									className="filter-input"
									placeholder={filter.placeholder}
									maxLength={filter.maxLength}
									onType={setValue}
									value={(value || filter.value) as string}
								/>
								<Icon
									className="selection-icon"
									name={
										!isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
								/>
							</button>
						</div>
					) : filter.type === "user" ? (
						<div className="filter-options-container">
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": isDefaultValue,
								})}
								onClick={() => setValue(filter.defaultValue)}
							>
								<span class="filter-option-name">{filter.defaultLabel}</span>
								<Icon
									className="selection-icon"
									name={
										isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
								/>
							</button>
							<button
								type="button"
								className={classNames("filter-option", {
									"selected-option": !isDefaultValue,
								})}
								onClick={() => {
									if (hasChanged && isDefaultValue) {
										setValue(filter.value);
									}
								}}
							>
								{!value && <UserLookup updateUser={setValue} />}
								{value && (
									<div className="target-user-container">
										<AgentMentionContainer
											targetType="User"
											targetId={(value as RequestedUser).id}
											name={(value as RequestedUser).name}
											hasVerifiedBadge={
												(value as RequestedUser).hasVerifiedBadge
											}
										/>
										<button
											type="button"
											className="remove-target-btn roseal-btn"
											onClick={() => {
												setValue(undefined);
											}}
										>
											<Icon name="close" size="16x16" />
										</button>
									</div>
								)}
								<Icon
									className="selection-icon"
									name={
										!isDefaultValue
											? "radio-check-circle-filled"
											: "radio-check-circle"
									}
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
													className="selection-icon"
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

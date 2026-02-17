import classNames from "classnames";
import type { ComponentChild } from "preact";
import type { HTMLAttributes } from "preact";
import Icon from "./Icon.tsx";

export type SelectionItem<T extends string | number | boolean | undefined> = {
	value: T;
	label: ComponentChild;
	disabled?: boolean;
};

export type SelectionItemGroup<T extends string | number | boolean | undefined> = {
	id: string | number;
	label: string;
	items: SelectionItem<T>[];
};

export type DropdownProps<T extends string | number | boolean | undefined> = OmitExtend<
	HTMLAttributes<HTMLSelectElement>,
	{
		disabled?: boolean;
		className?: string;
		selectedItemValue?: T;
		selectionItems: (SelectionItem<T> | SelectionItemGroup<T>)[];
		placeholder?: string | number;
		onSelect?: (value: T) => void;
		borderless?: boolean;
	}
>;

export default function Dropdown<T extends string | number | boolean | undefined>({
	className,
	selectedItemValue,
	placeholder,
	selectionItems,
	onSelect,
	borderless,
	disabled,
	...otherProps
}: DropdownProps<T>) {
	const values = selectionItems.flatMap((item) => ("items" in item ? item.items : item));

	return (
		<div
			className={classNames("roseal-dropdown rbx-select-group select-group", className, {
				"rbx-select-group-borderless": borderless,
				disabled,
			})}
		>
			<select
				disabled={disabled}
				value={String(selectedItemValue)}
				className={classNames("input-field rbx-select select-option", {
					"rbx-select-borderless": borderless,
				})}
				onChange={(e) => {
					const target = e.target as HTMLSelectElement | null;
					if (!target) {
						return;
					}

					const selection = target?.selectedIndex;
					if (selection === -1) {
						return;
					}

					const selectedItem = values[selection];
					if (selectedItem === undefined) {
						return;
					}

					onSelect?.(selectedItem?.value);
				}}
				{...otherProps}
			>
				{placeholder && (
					<option key={placeholder} value={placeholder} hidden>
						{placeholder}
					</option>
				)}
				{selectionItems.map((selectionItem) => {
					if ("items" in selectionItem) {
						return (
							<optgroup key={selectionItem.id} label={selectionItem.label}>
								{selectionItem.items.map((item) => (
									<option
										key={item.value}
										value={String(item.value)}
										disabled={item.disabled}
									>
										{item.label}
									</option>
								))}
							</optgroup>
						);
					}

					return (
						<option
							key={selectionItem.value}
							value={String(selectionItem.value)}
							disabled={selectionItem.disabled}
						>
							{selectionItem.label}
						</option>
					);
				})}
			</select>
			<Icon name="down" size="16x16" className="icon-arrow" />
		</div>
	);
}

import { Dropdown as BSDropdown } from "react-bootstrap";

export type BootstrapDropdownProps<T extends string | number | boolean | undefined> = {
	id?: string;
	autoIncludeAnchors?: boolean;
	icon?: string;
	menuClassName?: string;
	className?: string;
	disabled?: boolean;
	selectedItemValue?: T;
	selectionItems: {
		value: T;
		label: ComponentChild;
		className?: string;
	}[];
	onSelect?: (value: T) => void;
	fitContent?: boolean;
};

export function BootstrapDropdown<T extends string | number | boolean | undefined>({
	id,
	autoIncludeAnchors = true,
	icon,
	menuClassName,
	className,
	disabled,
	selectionItems,
	selectedItemValue,
	onSelect,
	fitContent = true,
	...otherProps
}: BootstrapDropdownProps<T>) {
	const selectedItemLabel = selectionItems.find(
		(item) => item.value === selectedItemValue,
	)?.label;

	return (
		<BSDropdown
			{...otherProps}
			id={id}
			className={classNames(className, "roseal-bootstrap-dropdown", "input-group-btn", {
				"dropdown-fit-content": fitContent,
			})}
		>
			<BSDropdown.Toggle
				className={classNames("input-dropdown-btn", {
					disabled,
				})}
			>
				{icon && <span className={classNames("dropdown-icon")} />}
				{selectedItemLabel && (
					<span className="rbx-selection-label">{selectedItemLabel}</span>
				)}
				<Icon name="down" size="16x16" />
			</BSDropdown.Toggle>
			<BSDropdown.Menu as="ul" className={menuClassName}>
				{selectionItems.map((item) => (
					<BSDropdown.Item
						as="li"
						key={item.value}
						onClick={() => onSelect?.(item.value)}
						active={item.value === selectedItemValue}
						className={item.className}
					>
						{autoIncludeAnchors ? (
							<button type="button">{item.label}</button>
						) : (
							item.label
						)}
					</BSDropdown.Item>
				))}
			</BSDropdown.Menu>
		</BSDropdown>
	);
}

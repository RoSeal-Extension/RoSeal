import classNames from "classnames";
import type { ComponentChild, ComponentChildren } from "preact";
import Loading from "./Loading";
import { useRef, useState } from "preact/hooks";
import TextInput from "./TextInput";
import { useOnClickOutside } from "usehooks-ts";
import Icon from "./Icon";

export type ItemLookupProps<
	T extends {
		key: string | number;
	},
> = {
	items?: T[] | null;
	errorMessage?: string;
	loading?: boolean;
	className?: string;
	listClassName?: string;
	children?: ComponentChildren;
	onClick: (item: T) => void;
	render: (item: T) => ComponentChild;

	inputPlaceholder: string;
	inputClassName?: string;
	inputDisabled?: boolean;
	onType: (value: string) => void;
	onSubmit: (value: string) => void;
	inputValue: string;
	blurOnSubmit?: boolean;
};

export default function ItemLookup<
	T extends {
		key: string | number;
	},
>({
	items,
	errorMessage,
	loading,
	className,
	listClassName,
	children,
	onClick,
	render,
	inputPlaceholder,
	inputClassName,
	inputDisabled,
	onType,
	onSubmit,
	inputValue,
	blurOnSubmit = true,
}: ItemLookupProps<T>) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useOnClickOutside(ref, () => setOpen(false));

	return (
		<div
			className={classNames(
				"item-lookup input-group with-search-bar",
				{
					open,
					"form-has-error": errorMessage,
				},
				className,
			)}
			ref={ref}
			onFocus={() => setOpen(true)}
		>
			<TextInput
				className={classNames("item-lookup-field", inputClassName)}
				placeholder={inputPlaceholder}
				maxLength={20}
				onType={onType}
				onEnter={onSubmit}
				blurOnEnter={blurOnSubmit}
				value={inputValue}
				disabled={inputDisabled}
			/>
			{children}
			<div className="input-group-btn">
				<button
					className="input-addon-btn"
					type="button"
					onClick={() => {
						onSubmit(inputValue);
					}}
				>
					<Icon name="search" />
				</button>
			</div>
			{open && (
				<ul
					className={classNames(
						"dropdown-menu search-results-dropdown-menu roseal-scrollbar",
						listClassName,
					)}
				>
					{items && !errorMessage && !loading ? (
						items.map((item, index) => (
							<li
								key={item.key}
								className={classNames("search-result", {
									active: index === 0,
								})}
								onClick={() => {
									onClick(item);
									setOpen(false);
								}}
							>
								{render(item)}
							</li>
						))
					) : errorMessage && !loading ? (
						<li className="text-center">
							<span className="text-error">{errorMessage}</span>
						</li>
					) : (
						loading && (
							<li className="search-result-loading">
								<Loading size="sm" />
							</li>
						)
					)}
				</ul>
			)}
		</div>
	);
}

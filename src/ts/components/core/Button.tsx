import classNames from "classnames";
import type { JSX, ComponentChildren } from "preact";

export type WidthVariant = "min" | "full" | "fixed" | "default";
export type WidthSubvariant = "lg";
export type SizeVariant = "lg" | "md" | "sm" | "xs" | "default";
export type IconType = "generic" | "navigation";

export type ButtonType =
	| "primary"
	| "secondary"
	| "control"
	| "cta"
	| "alert"
	| "growth"
	| "buy"
	| "branded-robux-white"
	| "common-play-game"
	| "default";

export function getCssClass(type: ButtonType = "default", size: SizeVariant = "default"): string {
	return `btn${type !== "default" ? `-${type}` : ""}${size !== "default" ? `-${size}` : ""}`;
}

export function getWidthCssClass(width: WidthVariant = "default", sub?: WidthSubvariant): string {
	return `btn-${width !== "default" ? `${width}-` : ""}width${sub ? `-${sub}` : ""}`;
}

export type ButtonProps<T extends keyof JSX.IntrinsicElements> = OmitExtend<
	JSX.IntrinsicElements[T],
	{
		as?: T;
		className?: string;
		type?: ButtonType;
		size?: SizeVariant;
		width?: WidthVariant;
		subWidth?: WidthSubvariant;
		disabled?: boolean;
		isLoading?: boolean;
		children?: ComponentChildren;
	}
>;

export default function Button<T extends keyof JSX.IntrinsicElements = "button">({
	as: asType,
	className,
	type = "primary",
	size = "md",
	width = "min",
	subWidth,
	disabled: _disabled = false,
	isLoading = false,
	children,
	onClick,
	...otherProps
}: ButtonProps<T>) {
	const disabled = _disabled || isLoading;
	const cssClassName = classNames(
		className,
		getCssClass(type, size),
		getWidthCssClass(width, subWidth),
		{ disabled },
	);
	const Element: JSX.ElementType = asType ?? "button";

	return (
		<Element
			{...otherProps}
			type="button"
			className={cssClassName}
			disabled={disabled}
			// @ts-expect-error: This is fine right here, can't exactly tell it that we're fine with this
			onClick={disabled ? undefined : onClick}
		>
			{children}
		</Element>
	);
}

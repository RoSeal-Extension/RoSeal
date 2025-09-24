import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";
import type { IconType, SizeVariant } from "./Button.tsx";
import Icon from "./Icon.tsx";

function getCssClass(
	iconName: string,
	iconType: IconType = "generic",
	size: SizeVariant = "default",
): string {
	return `btn-${iconType}-${iconName}-${size}`;
}

export type IconButtonProps = OmitExtend<
	JSX.HTMLAttributes<HTMLButtonElement>,
	{
		className?: string;
		iconType?: IconType;
		iconName: string;
		size?: SizeVariant;
		disabled?: boolean;
		isLoading?: boolean;
		altName?: string;
		children?: ComponentChildren;
	}
>;

export default function IconButton({
	className,
	iconType,
	iconName,
	size,
	disabled: _disabled,
	isLoading,
	altName,
	children,
	...otherProps
}: IconButtonProps) {
	const disabled = _disabled || isLoading;

	return (
		<button
			{...otherProps}
			className={classNames(className, getCssClass(iconName, iconType, size), {
				disabled,
			})}
			disabled={disabled}
			title={altName ?? iconName.replace(/-/g, " ")}
		>
			<Icon name={iconName} />
			{children}
		</button>
	);
}

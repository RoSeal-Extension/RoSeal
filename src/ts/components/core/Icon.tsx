import classNames from "classnames";
import type { JSX } from "preact";

export type IconProps<T extends keyof JSX.IntrinsicElements = "span"> = OmitExtend<
	JSX.IntrinsicElements[T],
	{
		as?: T;
		className?: string;
		type?: string;
		name: string;
		size?: string;
		addSizeClass?: boolean;
	}
>;

export default function Icon<T extends keyof JSX.IntrinsicElements = "span">({
	as: asType,
	type,
	name,
	size,
	className,
	addSizeClass,
	...otherProps
}: IconProps<T>) {
	const iconName = `icon-${type ? `${type}-` : ""}${name}`;

	const Element: JSX.ElementType = asType ?? "span";
	return (
		<Element
			className={classNames(
				`${iconName}${size && !addSizeClass ? `-${size}` : ""}`,
				className,
				{
					[`${iconName}-${size}`]: size && addSizeClass,
				},
			)}
			{...otherProps}
		/>
	);
}

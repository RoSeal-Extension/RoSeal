import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type ExperienceFieldProps = OmitExtend<
	JSX.IntrinsicElements["li"],
	{
		title?: string | JSX.Element;
	}
>;

export default function ExperienceField({
	title,
	className,
	children,
	...otherProps
}: ExperienceFieldProps) {
	return (
		<li className={classNames("game-stat", className)} {...otherProps}>
			<p className="text-label text-overflow font-caption-header">{title}</p>
			{children}
		</li>
	);
}

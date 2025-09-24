import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type ExperienceEventFieldProps = OmitExtend<
	JSX.IntrinsicElements["div"],
	{
		title?: string | JSX.Element;
	}
>;

export default function ExperienceEventField({
	title,
	className,
	children,
	...otherProps
}: ExperienceEventFieldProps) {
	return (
		<div className={classNames("experience-event-field", className)} {...otherProps}>
			<div className="text-overflow">{title}</div>
			{children}
		</div>
	);
}

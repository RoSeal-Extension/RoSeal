import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type UserProfileFieldProps = OmitExtend<
	JSX.IntrinsicElements["li"],
	{
		title?: string | JSX.Element;
	}
>;

export default function UserProfileField({
	title,
	className,
	children,
	...otherProps
}: UserProfileFieldProps) {
	return (
		<li className={classNames("profile-stat roseal-profile-stat", className)} {...otherProps}>
			<p className="text-label">{title}</p>
			{children}
		</li>
	);
}

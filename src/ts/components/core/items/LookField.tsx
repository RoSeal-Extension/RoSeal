import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type LookFieldProps = OmitExtend<
	JSX.IntrinsicElements["div"],
	{
		title?: string | JSX.Element;
	}
>;

export default function LookField({ title, className, children, ...otherProps }: LookFieldProps) {
	return (
		<div
			className={classNames("clearfix toggle-target look-info-row-container", className)}
			{...otherProps}
		>
			<div className="font-header-1 text-subheader text-label text-overflow row-label">
				{title}
			</div>
			{children}
		</div>
	);
}

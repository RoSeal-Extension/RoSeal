import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type ItemFieldProps = OmitExtend<
	JSX.IntrinsicElements["div"],
	{
		title?: string | JSX.Element;
		useNewClasses?: boolean;
		labelClassName?: string;
	}
>;

export default function ItemField({
	title,
	className,
	children,
	useNewClasses = true,
	labelClassName,
	...otherProps
}: ItemFieldProps) {
	const containerClassName = classNames(
		`clearfix ${useNewClasses ? "item-info-row-container" : "item-field-container"}`,
		className,
	);

	return (
		<div className={containerClassName} {...otherProps}>
			{title && (
				<div
					className={classNames(
						`text-label text-overflow text-overflow-hover ${
							useNewClasses ? "text-subheader row-label" : "field-label"
						}`,
						labelClassName,
					)}
				>
					{title}
				</div>
			)}
			{children}
		</div>
	);
}

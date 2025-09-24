import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type DropdownLabelProps = {
	containerClassName?: string;
	id?: string;
	containerId?: string;
	label: string;
	small?: boolean;
	children?: ComponentChildren;
};

export default function DropdownLabel({
	containerId,
	id,
	label,
	containerClassName,
	small,
	children,
}: DropdownLabelProps) {
	return (
		<div
			className={classNames("dropdown-btn select-group", containerClassName)}
			id={containerId}
		>
			<label
				id={id && `${id}-label`}
				for={id}
				className={classNames("text-label select-label", {
					"font-caption-header": small,
					text: small,
				})}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

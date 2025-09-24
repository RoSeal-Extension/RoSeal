import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";

export type CheckboxFieldProps = OmitExtend<
	JSX.HTMLAttributes<HTMLInputElement>,
	{
		className?: string;
		onChange?: (value: boolean) => void;
		disabled?: boolean;
		checked?: boolean;
		children?: ComponentChildren;
	}
>;

export default function CheckboxField({
	children,
	checked = false,
	className,
	onChange,
	disabled,
	...otherProps
}: CheckboxFieldProps) {
	return (
		<div
			className={classNames("checkbox", className)}
			onClick={() => {
				onChange?.(!checked);
			}}
		>
			<input {...otherProps} type="checkbox" checked={checked} disabled={disabled} />
			{children}
		</div>
	);
}

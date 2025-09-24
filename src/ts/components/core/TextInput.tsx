import classNames from "classnames";
import type { JSX } from "preact/jsx-runtime";

export type TextInputProps = OmitExtend<
	JSX.IntrinsicElements["input"],
	{
		onType?: (value: string) => void;
		onChange?: (value: string) => void;
		onEnter?: (value: string) => void;
		typeCheck?: (value: string) => boolean;
		typeCheckCallback?: string | undefined;
		blurOnEnter?: boolean;
		disabled?: boolean;
		typePattern?: RegExp;
		min?: number;
		max?: number;
		step?: number;
		enterOnBlur?: boolean;
	}
>;

export default function TextInput({
	className,
	disabled,
	typePattern,
	blurOnEnter = true,
	enterOnBlur = false,
	typeCheckCallback,
	typeCheck,
	onChange,
	onType,
	onKeyDown,
	onEnter,
	...otherProps
}: TextInputProps) {
	return (
		<input
			className={classNames("input-field form-control", className, {
				disabled,
			})}
			type="text"
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					onEnter?.(e.currentTarget.value);

					if (blurOnEnter) {
						e.currentTarget.blur();
					}
				}

				if (e.key.length === 1) {
					if (typePattern && !typePattern.test(e.key)) {
						return e.preventDefault();
					}

					onKeyDown?.(e);
				}
			}}
			onChange={(e) => {
				if (
					otherProps.min !== undefined &&
					(otherProps.step === 1
						? Number.parseInt(e.currentTarget.value, 10)
						: Number.parseFloat(e.currentTarget.value)) < otherProps.min
				) {
					e.currentTarget.value = otherProps.min.toString();
					e.preventDefault();
					onType?.(e.currentTarget.value);
					return;
				}

				if (typeCheck && !typeCheck(e.currentTarget.value)) {
					e.currentTarget.value = typeCheckCallback ?? "";
					onType?.(e.currentTarget.value);
					return e.preventDefault();
				}

				if (
					otherProps.max !== undefined &&
					(otherProps.step === 1
						? Number.parseInt(e.currentTarget.value, 10)
						: Number.parseFloat(e.currentTarget.value)) > otherProps.max
				) {
					e.currentTarget.value = otherProps.max.toString();
					e.preventDefault();
					onType?.(e.currentTarget.value);
					return;
				}

				onType?.(e.currentTarget.value);
			}}
			onBlur={(e) => {
				onChange?.(e.currentTarget.value);
				if (enterOnBlur) {
					onEnter?.(e.currentTarget.value);
				}
			}}
			disabled={disabled}
			autocomplete="off"
			data-1p-ignore
			data-lpignore="true"
			data-protonpass-ignore="true"
			{...otherProps}
		/>
	);
}

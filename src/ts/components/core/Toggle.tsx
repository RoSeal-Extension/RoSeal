import classNames from "classnames";
import type { ComponentChild, JSX } from "preact";

type ToggleProps = {
	small?: boolean;
	isOn?: boolean;
	className?: string;
	disabled?: boolean;
	onToggle?: (isOn: boolean) => Promise<void> | void;
	style?: JSX.CSSProperties;
	children?: ComponentChild;
};

export default function Toggle({
	small,
	isOn = false,
	className,
	disabled,
	onToggle,
	style,
}: ToggleProps) {
	return (
		<button
			style={style}
			type="button"
			className={classNames("btn-toggle", className, {
				disabled,
				on: isOn,
				"btn-small-toggle": small,
			})}
			onClickCapture={(e) => {
				if (!onToggle) {
					return;
				}

				e.stopImmediatePropagation();
				if (!disabled) {
					onToggle(!isOn);
				}
			}}
		>
			<span className="toggle-flip" />
			<span className="toggle-on" />
			<span className="toggle-off" />
		</button>
	);
}

import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";
import { OverlayTrigger, type OverlayTriggerProps, Popover as BSPopover } from "react-bootstrap";
import type { ComponentChildren, VNode } from "preact";
import type { JSX } from "preact/jsx-runtime";

export type PopoverProps = OmitExtend<
	OverlayTriggerProps,
	{
		id?: string;
		overlay?: undefined;
		style?: JSX.CSSProperties;
		className?: string;
		button: VNode;
		closeOnClick?: boolean;
		children?: ComponentChildren;
	}
>;

export default function Popover({
	id,
	style,
	className,
	button,
	children,
	rootClose = true,
	closeOnClick,
	placement,
	show,
	...otherProps
}: PopoverProps) {
	const [state, setState] = useState(false);

	useEffect(() => {
		setState(show === true);
	}, [show]);

	return (
		<OverlayTrigger
			{...otherProps}
			show={show}
			placement={placement}
			overlay={
				<BSPopover
					id={id as string}
					style={style}
					className={classNames(
						"roseal-popover",
						className,
						state ? "in" : "out",
						placement,
						"show",
					)}
					show={state}
					onClick={() => {
						if (closeOnClick) {
							// a little hack
							// https://stackoverflow.com/a/56237661
							document.body.click();
						}
					}}
				>
					{children}
				</BSPopover>
			}
			rootClose={rootClose}
			onEnter={(...args) => {
				setState(true);
				otherProps?.onEnter?.(...args);
			}}
			onExit={(...args) => {
				setState(false);
				otherProps.onExit?.(...args);
			}}
		>
			{button}
		</OverlayTrigger>
	);
}

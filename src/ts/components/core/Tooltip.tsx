import { useEffect, useRef, useState } from "preact/hooks";
import classNames from "classnames";
import {
	OverlayTrigger,
	Tooltip as BSTooltip,
	type TooltipProps as BSTooltipProps,
	type OverlayTriggerProps,
} from "react-bootstrap";
import type { ComponentChild, JSX, VNode } from "preact";
import { watch } from "src/ts/helpers/elements";

export type TooltipProps = OmitExtend<
	BSTooltipProps,
	{
		children: ComponentChild;
		button: VNode;
		id?: string;
		containerId?: string;
		className?: string;
		containerClassName?: string;
		trigger?: OverlayTriggerProps["trigger"];
		onEnter?: OverlayTriggerProps["onEnter"];
		onExit?: OverlayTriggerProps["onExit"];
		as?: keyof JSX.IntrinsicElements | unknown;
		container?: OverlayTriggerProps["container"];
		includeContainerClassName?: boolean;
		containerProps?: JSX.IntrinsicElements["div"];
		skipElement?: boolean;
	}
>;

export default function Tooltip({
	placement,
	children,
	button,
	id,
	containerId,
	className,
	containerClassName,
	includeContainerClassName = true,
	trigger,
	onEnter,
	onExit,
	as: Element = "span",
	container,
	containerProps,
	skipElement,
	...otherProps
}: TooltipProps) {
	const [state, setState] = useState<boolean>(false);
	const ref = useRef<HTMLElement>(null);

	const tooltip = (
		<BSTooltip
			id={id!}
			className={classNames(
				"roseal-tooltip",
				className,
				state ? "in" : "out",
				placement,
				"show",
			)}
			{...otherProps}
		>
			{children}
		</BSTooltip>
	);

	useEffect(() => {
		if (!ref.current) return;

		return watch(
			ref.current,
			(el, kill) => {
				if (el.isConnected) {
					return;
				}

				setState(false);
				kill?.();
			},
			true,
		);
	}, [ref.current]);

	const overlayTrigger = (
		<OverlayTrigger
			container={container}
			trigger={trigger}
			placement={placement}
			overlay={tooltip}
			onEnter={(...args) => {
				setState(true);
				onEnter?.(...args);
			}}
			onExit={(...args) => {
				setState(false);
				onExit?.(...args);
			}}
		>
			{button}
		</OverlayTrigger>
	);

	if (skipElement) {
		return overlayTrigger;
	}

	return (
		// @ts-expect-error: Can't bother fixing type
		<Element
			className={classNames(
				{
					"tooltip-container": includeContainerClassName,
				},
				containerClassName,
			)}
			id={containerId}
			ref={ref}
			{...containerProps}
		>
			{overlayTrigger}
		</Element>
	);
}

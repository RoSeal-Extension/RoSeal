import { useState } from "preact/hooks";
import classNames from "classnames";
import { getMessage } from "../../helpers/i18n/getMessage";
import type { ComponentChildren } from "preact";

export type ToggleTargetProps = {
	maxScrollHeight?: number;
	className?: string;
	containerClassName?: string;
	id?: string;
	includeToggleTarget?: boolean;
	children?: ComponentChildren;
	includeRoSealPrefix?: boolean;
};

export default function ToggleTarget({
	maxScrollHeight = 96,
	className,
	containerClassName,
	id,
	children,
	includeToggleTarget = true,
	includeRoSealPrefix = true,
}: ToggleTargetProps) {
	const [collapsed, setCollapsed] = useState(true);
	const [canCollapse, setCanCollapse] = useState(false);

	const prefix = includeRoSealPrefix ? "roseal-" : "";
	return (
		<div
			className={classNames(
				{
					[`${prefix}toggle-target`]: includeToggleTarget,
				},
				containerClassName,
			)}
		>
			<pre
				className={classNames(className, {
					[`${prefix}content-overflow-toggle`]: canCollapse,
					[`${prefix}content-overflow-toggle-off`]: canCollapse && !collapsed,
					[`${prefix}content-height`]: canCollapse && collapsed,
				})}
				id={id}
				ref={(el) => {
					if (el?.scrollHeight) {
						setCanCollapse(el.scrollHeight > maxScrollHeight);
					} else if (el?.isConnected === false) {
						setTimeout(() => setCanCollapse(el.scrollHeight > maxScrollHeight));
					}
				}}
			>
				<span>{children}</span>
			</pre>
			{canCollapse && (
				<span
					className={`${prefix}toggle-content text-link cursor-pointer`}
					onClick={() => setCollapsed(!collapsed)}
				>
					{getMessage(`genericToggleTarget.read${collapsed ? "More" : "Less"}`)}
				</span>
			)}
		</div>
	);
}

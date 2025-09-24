import type { ComponentChildren, JSX } from "preact";
import classNames from "classnames";

export type TabsContainerProps = OmitExtend<
	JSX.HTMLAttributes<HTMLDivElement>,
	{
		isScrollable?: boolean;
		className?: string;
		children?: ComponentChildren;
	}
>;

export default function TabsContainer({
	isScrollable,
	className,
	children,
	...otherProps
}: TabsContainerProps) {
	const tabsClass = classNames(className, "rbx-tabs-horizontal", {
		"rbx-scrollable-tabs-horizontal": isScrollable,
	});

	return (
		<div {...otherProps} className={tabsClass}>
			{children}
		</div>
	);
}

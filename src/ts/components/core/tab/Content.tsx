import type { Signal } from "@preact/signals";
import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";

export type TabContentProps = OmitExtend<
	JSX.HTMLAttributes<HTMLDivElement>,
	{
		id?: string;
		isActive?: boolean | Signal<boolean>;
		className?: string;
		children?: ComponentChildren;
	}
>;

export default function TabContent({ isActive, className, id, children }: TabContentProps) {
	const tabContentClass = classNames(className, "tab-pane", {
		active: isActive && typeof isActive !== "boolean" ? isActive.value : isActive,
	});

	return (
		<div role="tabpanel" className={tabContentClass} id={id}>
			{children}
		</div>
	);
}

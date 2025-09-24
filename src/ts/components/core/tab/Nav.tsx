import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";

export type TabNavProps = OmitExtend<
	JSX.HTMLAttributes<HTMLLIElement>,
	{
		className?: string;
		isActive?: boolean;
		children?: ComponentChildren;
	}
>;

export default function TabNav({ isActive, className, children, ...otherProps }: TabNavProps) {
	const tabClass = classNames(className, "rbx-tab", { active: isActive });

	return (
		<li {...otherProps} className={tabClass}>
			{children}
		</li>
	);
}

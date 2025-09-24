import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type VerticalMenuProps = {
	className?: string;
	children?: ComponentChildren;
};

export default function VerticalMenu({ className, children }: VerticalMenuProps) {
	return (
		<ul className={classNames("menu-vertical", className)} role="tablist">
			{children}
		</ul>
	);
}

export { default as Option } from "./Option.tsx";
export { default as OptionContent } from "./OptionContent.tsx";
export { default as OptionSecondaryContainer } from "./OptionSecondaryContainer.tsx";

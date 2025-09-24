import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type TabNavsProps = {
	className?: string;
	children?: ComponentChildren;
};

export default function TabNavs({ children, className }: TabNavsProps) {
	return <ul className={classNames("nav nav-tabs", className)}>{children}</ul>;
}

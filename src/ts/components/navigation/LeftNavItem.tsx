import type { ComponentChild, ComponentChildren } from "preact";
import LazyLink from "../core/LazyLink";
import { useMemo } from "preact/hooks";
import currentUrl from "src/ts/utils/currentUrl";
import classNames from "classnames";

export type LeftNavItemProps = {
	iconComponent: ComponentChild;
	children: ComponentChildren;
	id: string;
	href?: string;
	regex?: RegExp;
};

export default function LeftNavItem({
	iconComponent,
	children,
	id,
	href,
	regex,
}: LeftNavItemProps) {
	const isActive = useMemo(() => {
		if (!href || !regex) return false;

		return regex.test(currentUrl.value.path.realPath);
	}, [href, regex, currentUrl.value]);

	return (
		<li
			key={id}
			className={classNames("roseal-left-nav-item", {
				active: isActive,
			})}
		>
			<LazyLink href={href} className="nav-item-link">
				<span className="nav-item-icon">{iconComponent}</span>
				<span className="nav-item-text">{children}</span>
			</LazyLink>
		</li>
	);
}

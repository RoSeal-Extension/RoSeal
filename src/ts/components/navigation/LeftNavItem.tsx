import type { ComponentChild, ComponentChildren } from "preact";
import LazyLink from "../core/LazyLink";

export type LeftNavItemProps = {
	iconComponent: ComponentChild;
	children: ComponentChildren;
	id: string;
	href?: string;
};

export default function LeftNavItem({ iconComponent, children, id, href }: LeftNavItemProps) {
	return (
		<li key={id} className="roseal-left-nav-item">
			<LazyLink href={href} className="nav-item-link">
				<span className="nav-item-icon">{iconComponent}</span>
				<span className="nav-item-text">{children}</span>
			</LazyLink>
		</li>
	);
}

import { toChildArray, type ComponentChildren } from "preact";
import Icon from "./Icon.tsx";

export type BreadcrumContainerProps = {
	children: ComponentChildren;
};

export default function BreadcrumContainer({ children }: BreadcrumContainerProps) {
	return (
		<ul className="breadcrumb-container">
			{children &&
				toChildArray(children).map((child, index, array) => {
					const sibling = array[index - 1];
					if (
						typeof child === "object" &&
						typeof sibling === "object" &&
						(("isFilter" in child.props && !child.props.isFilter) ||
							!("isFilter" in sibling.props) ||
							!sibling.props.isFilter)
					) {
						return (
							<>
								<li>
									<Icon name="right" size="16x16" />
								</li>
								{child}
							</>
						);
					}

					return child;
				})}
		</ul>
	);
}

export type BreadcrumbProps = {
	isFilter?: boolean;
	href?: string;
	onClick?: (event: MouseEvent) => void;
	children?: ComponentChildren;
};

export function Breadcrumb({ children, isFilter, href, onClick }: BreadcrumbProps) {
	if (isFilter) {
		return (
			<li className="breadcrumb-filter">
				<span className="breadcrumb-filter-name">{children}</span>
			</li>
		);
	}

	const Element = href ? "a" : "span";

	return (
		<li>
			<Element href={href} onClick={onClick}>
				{children}
			</Element>
		</li>
	);
}

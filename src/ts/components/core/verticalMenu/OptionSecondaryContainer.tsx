import type { ComponentChildren } from "preact";
import { cloneElement, isValidElement, toChildArray } from "preact";

export type OptionSecondaryContainerProps = {
	children?: ComponentChildren;
};

export default function OptionSecondaryContainer({ children }: OptionSecondaryContainerProps) {
	return (
		<li className="roseal-menu-secondary-container">
			<ul className="roseal-menu-secondary">
				{children &&
					toChildArray(children).map((child) => {
						if (isValidElement(child)) {
							return cloneElement(child, {
								...child.props,
								isSecondary: true,
							});
						}

						return child;
					})}
			</ul>
		</li>
	);
}

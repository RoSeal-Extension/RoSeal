import classNames from "classnames";
import {
	cloneElement,
	isValidElement,
	toChildArray,
	type ComponentChildren,
	type JSX,
} from "preact";

export type OptionProps = {
	id?: string;
	isActive?: boolean;
	as?: keyof JSX.IntrinsicElements;
	children?: ComponentChildren;
	isSecondary?: boolean;
};

export default function Option({
	id,
	isSecondary,
	isActive,
	children,
	as: Type = "li",
}: OptionProps) {
	return (
		<Type
			className={classNames("menu-option", {
				"roseal-menu-secondary-option": isSecondary,
				active: isActive,
			})}
			role="tab"
			id={id}
		>
			{isSecondary
				? children &&
					toChildArray(children).map((child) => {
						if (isValidElement(child)) {
							return cloneElement(child, {
								...child.props,
								isSecondary: true,
							});
						}

						return child;
					})
				: children}
		</Type>
	);
}

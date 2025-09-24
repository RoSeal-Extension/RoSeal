import classNames from "classnames";
import Icon from "../Icon.tsx";
import type { ComponentChild, ComponentChildren } from "preact";

export type OptionContentProps = {
	title: ComponentChild;
	id?: string;
	className?: string;
	useHash?: boolean;
	isSecondary?: boolean;
	active?: boolean;
	includeArrow?: boolean;
	hasSubtabs?: boolean;
	subtabActive?: boolean;
	onClick?: (event: MouseEvent) => void;
	children?: ComponentChildren;
};

export default function OptionContent({
	title,
	id,
	className,
	useHash,
	includeArrow,
	active,
	children,
	hasSubtabs,
	subtabActive,
	isSecondary,
	onClick,
}: OptionContentProps) {
	return (
		<a
			className={classNames("menu-option-content", active, className, {
				"roseal-menu-secondary-option-content": isSecondary,
				active,
			})}
			href={useHash && id ? `#${id}` : undefined}
			onClick={onClick}
		>
			<span className="font-caption-header">{title}</span>
			{hasSubtabs && <Icon name={subtabActive ? "up" : "down"} size="16x16" />}
			{includeArrow && <Icon name="right" size="16x16" />}
			{children}
		</a>
	);
}

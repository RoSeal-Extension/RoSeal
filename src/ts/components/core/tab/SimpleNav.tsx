import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type SimpleTabNavProps = {
	children?: ComponentChildren;
	active?: boolean;
	id: string;
	title: unknown;
	link?: boolean | string;
	subtitle?: unknown;
	onClick?: () => void;
	className?: string;
};

export default function SimpleTabNav({
	children,
	active,
	id,
	title,
	link = true,
	subtitle,
	onClick,
	className,
}: SimpleTabNavProps) {
	return (
		<li
			className={classNames("rbx-tab", className, {
				active,
			})}
			id={`tab-${id}`}
		>
			<a
				className="rbx-tab-heading"
				href={link ? (typeof link === "string" ? link : `#${id}`) : undefined}
				onClick={onClick}
			>
				<span className="text-lead">
					{title}
					{children}
				</span>
				{subtitle && <span className="rbx-tab-subtitle">{subtitle}</span>}
			</a>
		</li>
	);
}

export { default as Content } from "./Content.tsx";

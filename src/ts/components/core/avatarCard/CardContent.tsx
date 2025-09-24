import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type AvatarCardContentProps = {
	children: ComponentChildren;
	className?: string;
};

export default function AvatarCardContent({ children, className }: AvatarCardContentProps) {
	return <div className={classNames("avatar-card-content", className)}>{children}</div>;
}

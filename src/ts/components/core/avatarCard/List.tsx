import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type AvatarCardListProps = {
	className?: string;
	children: ComponentChildren;
};

export default function AvatarCardList({ className, children }: AvatarCardListProps) {
	return <ul className={classNames("hlist avatar-cards", className)}>{children}</ul>;
}

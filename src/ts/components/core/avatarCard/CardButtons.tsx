import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type AvatarCardButtonsProps = {
	children: ComponentChildren;
	className?: string;
};

export default function AvatarCardButtons({ children, className }: AvatarCardButtonsProps) {
	return <div className={classNames("avatar-card-btns", className)}>{children}</div>;
}

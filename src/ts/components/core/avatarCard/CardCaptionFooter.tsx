import classNames from "classnames";
import type { ComponentChildren } from "preact";

export type AvatarCardCaptionFooterProps = {
	children: ComponentChildren;
	className?: string;
};

export default function AvatarCardCaptionFooter({
	children,
	className,
}: AvatarCardCaptionFooterProps) {
	return (
		<div className={classNames("avatar-card-footer avatar-card-label", className)}>
			{children}
		</div>
	);
}

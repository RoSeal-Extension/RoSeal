import classNames from "classnames";
import type { ComponentChildren, JSX } from "preact";

export type AvatarCardItemProps = OmitExtend<
	JSX.HTMLAttributes<HTMLLIElement>,
	{
		id: string;
		disableCard?: boolean;
		children: ComponentChildren;
		className?: string;
	}
>;

export default function AvatarCardItem({
	id,
	disableCard,
	children,
	className,
	...otherProps
}: AvatarCardItemProps) {
	return (
		<li id={id} className={classNames("list-item avatar-card", className)} {...otherProps}>
			<div
				className={classNames("avatar-card-container", {
					disabled: disableCard,
				})}
			>
				{children}
			</div>
		</li>
	);
}

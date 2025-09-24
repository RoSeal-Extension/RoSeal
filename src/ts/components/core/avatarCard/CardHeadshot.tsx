import classNames from "classnames";
import type { ComponentChild } from "preact";

export type AvatarCardHeadshotProps = {
	className?: string;
	status?: string;
	statusLink?: string;
	imageLink?: string;
	statusIcon?: ComponentChild;
	thumbnail: ComponentChild;
};

export default function AvatarCardHeadshot({
	className,
	status,
	statusLink,
	imageLink,
	statusIcon,
	thumbnail,
}: AvatarCardHeadshotProps) {
	const presenceStatusIcon = statusIcon ?? <span className={`icon-${status}`} />;

	return (
		<div className={classNames("avatar avatar-card-fullbody", className)}>
			{imageLink ? (
				<a href={imageLink} className="avatar-card-link">
					{thumbnail}
				</a>
			) : (
				thumbnail
			)}
			{statusLink ? (
				<a href={statusLink} className="avatar-status">
					{presenceStatusIcon}
				</a>
			) : (
				<div className="avatar-status">{presenceStatusIcon}</div>
			)}
		</div>
	);
}

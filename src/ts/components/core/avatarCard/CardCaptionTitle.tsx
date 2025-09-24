import classNames from "classnames";
import VerifiedBadge from "../../icons/VerifiedBadge";

export type AvatarCardCaptionTitleProps = {
	title?: string;
	titleLink?: string;
	hasVerifiedBadge?: boolean;
	className?: string;
	isHidden?: boolean;
};

export default function AvatarCardCaptionTitle({
	title,
	titleLink,
	hasVerifiedBadge,
	className,
}: AvatarCardCaptionTitleProps) {
	return (
		<div
			className={classNames("avatar-name-container", className, {
				verified: hasVerifiedBadge,
				shimmer: !title,
			})}
		>
			{titleLink ? (
				<a href={titleLink} className="text-overflow avatar-name">
					{title}
				</a>
			) : (
				<div className="text-overflow avatar-name">{title}</div>
			)}
			{hasVerifiedBadge && (
				<VerifiedBadge className="verified-badge-friends-img" height={16} width={16} />
			)}
		</div>
	);
}

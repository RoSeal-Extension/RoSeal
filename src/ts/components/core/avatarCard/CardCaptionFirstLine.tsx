import classNames from "classnames";
import type { ComponentChild } from "preact";

export type AvatarCardCaptionFirstLineProps = {
	firstLine?: ComponentChild;
	firstLineLink?: string;
	isSingleLine?: boolean;
	className?: string;
};

export default function AvatarCardCaptionFirstLine({
	firstLine,
	firstLineLink,
	isSingleLine,
	className,
}: AvatarCardCaptionFirstLineProps) {
	const singleLineClass = classNames(className, { "text-overflow": isSingleLine });

	if (!firstLine) return null;

	if (firstLineLink) {
		return (
			<a
				href={firstLineLink}
				className={classNames("text-link avatar-status-link", singleLineClass)}
			>
				{firstLine}
			</a>
		);
	}

	return <div className={classNames("avatar-card-label", singleLineClass)}>{firstLine}</div>;
}

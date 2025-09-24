import classNames from "classnames";

export type AvatarCardCaptionStatusProps = {
	statusLink?: string;
	status: string;
	className?: string;
};

export default function AvatarCardCaptionStatus({
	statusLink,
	status,
	className,
}: AvatarCardCaptionStatusProps) {
	if (statusLink) {
		return (
			<a
				href={statusLink}
				className={classNames("text-link text-overflow avatar-status-link", className)}
			>
				{status}
			</a>
		);
	}

	return (
		<div className={classNames("text-overflow avatar-status-link", className)}>{status}</div>
	);
}

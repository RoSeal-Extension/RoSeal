import type { ComponentChild } from "preact";
import AvatarCardCaptionStatus from "./CardCaptionStatus";

export type AvatarCardCaptionSecondLineProps = {
	secondLine?: ComponentChild;
	status?: string;
	statusLink?: string;
};

export default function AvatarCardCaptionSecondLine({
	secondLine,
	status,
	statusLink,
}: AvatarCardCaptionSecondLineProps) {
	const renderStatusContainer = secondLine ?? status;

	if (!renderStatusContainer) return null;

	return (
		<span className="avatar-status-container">
			{secondLine && <div className="avatar-card-label">{secondLine}</div>}
			{status && <AvatarCardCaptionStatus status={status} statusLink={statusLink} />}
		</span>
	);
}

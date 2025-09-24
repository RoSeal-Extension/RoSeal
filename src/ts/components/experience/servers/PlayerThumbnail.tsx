import { useMemo } from "preact/hooks";
import { getUserProfileLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";

export type ServerPlayerThumbnailProps = {
	userId?: number;
	username?: string;
	playerToken?: string;
};

export default function ServerPlayerThumbnail({
	userId,
	username,
	playerToken,
}: ServerPlayerThumbnailProps) {
	const request = useMemo(
		() => ({
			type: "AvatarHeadShot" as const,
			targetId: userId,
			token: playerToken,
			size: "150x150",
		}),
		[userId, playerToken],
	);

	const thumbnail = (
		<Thumbnail containerClassName="avatar-card-image" altText={username} request={request} />
	);

	return (
		<span className="avatar avatar-headshot-md player-avatar">
			{userId !== undefined ? (
				<a className="avatar-card-link" href={getUserProfileLink(userId)}>
					{thumbnail}
				</a>
			) : (
				thumbnail
			)}
		</span>
	);
}

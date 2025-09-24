import type { Agent } from "src/ts/helpers/requests/services/assets";
import Thumbnail from "../Thumbnail";
import classNames from "classnames";
import { getGroupProfileLink, getUserProfileLink } from "src/ts/utils/links";
import VerifiedBadge from "../../icons/VerifiedBadge";

export type AgentMentionContainerProps = {
	targetId: number;
	targetType: Agent;
	name: string;
	hasVerifiedBadge: boolean;
	textLeft?: boolean;
	tab?: string;
	useLink?: boolean;
	usePlaceholder?: boolean;
	includeThumbnail?: boolean;
};

export default function AgentMentionContainer({
	targetId,
	targetType,
	name,
	hasVerifiedBadge,
	textLeft,
	tab,
	useLink = true,
	usePlaceholder,
	includeThumbnail = true,
}: AgentMentionContainerProps) {
	const thumbnail = includeThumbnail && (
		<span
			className={classNames(`${targetType.toLowerCase()} thumbnail-container`, {
				avatar: targetType === "User",
			})}
		>
			<Thumbnail
				request={{
					type: targetType === "User" ? "AvatarHeadShot" : "GroupIcon",
					size: "150x150",
					targetId: targetId,
				}}
				placeHolderData={
					usePlaceholder
						? {
								className: "icon-placeholder-avatar-headshot",
							}
						: undefined
				}
				containerClassName={targetType === "User" ? "avatar-card-image" : undefined}
			/>
		</span>
	);

	const Type = useLink ? "a" : "span";
	return (
		<Type
			className={classNames("dynamic-overflow-container mention-container", {
				"text-left": textLeft,
			})}
			href={
				useLink
					? targetType === "Group"
						? getGroupProfileLink(targetId, name, tab)
						: getUserProfileLink(targetId, tab)
					: undefined
			}
		>
			{!textLeft && thumbnail}
			<span
				className={classNames(
					`dynamic-ellipsis-item ${targetType.toLowerCase()}-name-container`,
					{
						"text-link": useLink,
					},
				)}
			>
				{name}
			</span>
			{hasVerifiedBadge && <VerifiedBadge width={16} height={16} />}
			{textLeft && thumbnail}
		</Type>
	);
}

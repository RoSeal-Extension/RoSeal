import { useMemo } from "preact/hooks";
import { presenceTypes } from "src/ts/constants/presence";
import { getDeviceMeta } from "src/ts/utils/context";
import { sendFollowPlayerIntoGame } from "src/ts/utils/gameLauncher";
import { determineCanJoinUser } from "src/ts/utils/joinData";
import {
	getExperienceLink,
	getUserProfileByUsernameLink,
	getUserProfileLink,
} from "src/ts/utils/links";
import AvatarCardHeadshot from "../core/avatarCard/CardHeadshot";
import Button from "../core/Button";
import PresenceStatusIcon from "../core/presence/StatusIcon";
import Thumbnail from "../core/Thumbnail";
import usePresence from "../hooks/usePresence";
import usePromise from "../hooks/usePromise";
import VerifiedBadge from "../icons/VerifiedBadge";
import type { FastUserSearchDetail } from "./FastUserSearch";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserFriendStatus } from "src/ts/helpers/requests/services/users";

export default function FastUserSearchItem({
	id,
	hasVerifiedBadge,
	combinedName,
	username,
	isFriends: _isFriends,
	isLoading,
	isYou,
}: FastUserSearchDetail) {
	const presence = usePresence(id);
	const profileLink = id
		? getUserProfileLink(id)
		: getUserProfileByUsernameLink(username);
	const presencePlaceLink = presence?.placeId
		? getExperienceLink(presence.placeId)
		: undefined;

	const [isFriends] = usePromise(() => {
		if (!id || _isFriends !== undefined) return _isFriends;

		return getUserFriendStatus({
			userId: id,
		}).then((data) => data.status === "Friends");
	}, [_isFriends, id]);
	const [joinStatus] = usePromise(async () => {
		if (!presence?.placeId || !id) return;

		for (const type of presenceTypes) {
			if (type.typeId === presence.userPresenceType) {
				if (type.type !== "InGame") return;
				break;
			}
		}

		const deviceMeta = await getDeviceMeta();
		const overrideDeviceType = deviceMeta?.deviceType ?? "Desktop";

		return determineCanJoinUser({
			userIdToFollow: id,
			overrideDeviceType,
		});
	}, [presence?.placeId]);

	const statusText = useMemo(() => {
		if (isYou) {
			return getMessage("navigation.fastSearch.user.status.you");
		}

		if (isLoading) {
			return getMessage("navigation.fastSearch.user.status.loading");
		}

		if (isFriends) {
			return getMessage("navigation.fastSearch.user.status.connection");
		}
	}, [isYou, isLoading, isFriends]);

	return (
		<li className="navbar-search-option rbx-clickable-li fast-user-search-item">
			<a className="new-navbar-search-anchor" href={profileLink}>
				<div className="user-info-container">
					<AvatarCardHeadshot
						imageLink={profileLink}
						statusIcon={presence && <PresenceStatusIcon presence={presence} />}
						thumbnail={
							<Thumbnail
								request={
									id
										? {
												type: "AvatarHeadShot",
												size: "150x150",
												targetId: id,
											}
										: undefined
								}
								data={
									id
										? undefined
										: {
												state: "Pending",
												loading: true,
											}
								}
								containerClassName="avatar-card-image"
							/>
						}
					/>
					<div className="user-info">
						<div className="user-names-container">
							<span className="text-name">{combinedName}</span>
							{hasVerifiedBadge && <VerifiedBadge height={16} width={16} />}
							{username !== combinedName && (
								<span className="text">
									{getMessage("fastUserSearch.item.username", {
										username,
									})}
								</span>
							)}
						</div>
						{statusText && (
							<span className="status-text small text">{statusText}</span>
						)}
					</div>
				</div>
				{joinStatus && (
					<div className="current-status-container">
						{presence?.lastLocation && presencePlaceLink && (
							<a
								className="text-link text-overflox presence-location"
								href={presencePlaceLink}
							>
								{presence.lastLocation}
							</a>
						)}
						<Button
							type="growth"
							className="join-user-btn"
							disabled={joinStatus.disabled}
							onClick={(e) => {
								e.preventDefault();
								e.stopImmediatePropagation();

								sendFollowPlayerIntoGame({
									userId: id!,
									joinAttemptOrigin: "JoinUser",
									joinAttemptId: crypto.randomUUID(),
								});
							}}
						>
							{joinStatus.message || getMessage("fastUserSearch.item.joinUser")}
						</Button>
					</div>
				)}
			</a>
		</li>
	);
}

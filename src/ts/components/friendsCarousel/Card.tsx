import MdOutlineBlock from "@material-symbols/svg-600/outlined/block-fill.svg";
import classNames from "classnames";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { presenceTypes } from "src/ts/constants/presence";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { sendFollowPlayerIntoGame } from "src/ts/utils/gameLauncher";
import { type CanJoinUserDetermination, determineCanJoinUser } from "src/ts/utils/joinData";
import { getExperienceLink, getUserProfileLink } from "src/ts/utils/links";
import AvatarCardHeadshot from "../core/avatarCard/CardHeadshot";
import Button from "../core/Button";
import Icon from "../core/Icon";
import Popover from "../core/Popover";
import PresenceStatusIcon from "../core/presence/StatusIcon";
import Thumbnail from "../core/Thumbnail";
import useFeatureValue from "../hooks/useFeatureValue";
import usePresence from "../hooks/usePresence";
import useProfileData from "../hooks/useProfileData";
import VerifiedBadge from "../icons/VerifiedBadge";
import type { ConnectionType } from "src/ts/constants/friends";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getConnectionTypeDisplayName, getConnectionTypeIcon } from "../userFriends/utils/types";

export type FriendsListCardProps = {
	userId: number;
	blockedUniverseIds?: number[];
	canChat?: boolean;
	connectionType?: ConnectionType;
};

export default function FriendsListCard({
	userId,
	blockedUniverseIds,
	canChat,
	connectionType,
}: FriendsListCardProps) {
	const [showPopover, setShowPopover] = useState(false);
	const [bypassBlockedView, setBypassBlockedView] = useState(false);
	const [joinStatus, setJoinStatus] = useState<CanJoinUserDetermination>();

	const [checkJoinStatusEnabled] = useFeatureValue("userJoinCheck", false);
	const [cardUsernameEnabled] = useFeatureValue(
		"improvedConnectionsCarousel.showCardUsername",
		false,
	);

	const ref = useRef<HTMLDivElement>(null);
	const presenceData = usePresence(userId);

	const presenceType = useMemo(
		() => presenceTypes.find((type) => type.typeId === presenceData?.userPresenceType),
		[presenceData?.userPresenceType],
	);
	const profileData = useProfileData({
		userId,
	});
	const presenceText = useMemo(() => {
		let text = presenceData?.lastLocation;
		if (!text) return;

		if (text.length > 15) {
			text = `${text.slice(0, 15)}...`;
		}

		return text;
	}, [presenceData?.lastLocation]);

	const presencePlaceId = presenceData?.placeId;
	const presencePlaceLink =
		presencePlaceId !== undefined && presencePlaceId !== null
			? getExperienceLink(presencePlaceId)
			: undefined;

	const profileLink = getUserProfileLink(userId);
	const isInGame = presenceType?.type === "InGame" && !!presenceData?.universeId;

	const isInBlockedGame =
		!!presenceData?.universeId && blockedUniverseIds?.includes(presenceData.universeId);

	const startChat = useCallback(() => {
		sendMessage("triggerHandler", [
			"Roblox.Chat.StartChat",
			{
				userId,
			},
		]);
	}, [userId]);

	const viewProfile = useCallback(() => {
		window.open(profileLink, "_blank");
	}, [userId]);

	const joinUser = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();
			setShowPopover(false);

			sendFollowPlayerIntoGame({
				userId,
				joinAttemptOrigin: "JoinUser",
				joinAttemptId: crypto.randomUUID(),
			});
		},
		[userId],
	);

	const [connectionTypeIcon, connectionTypeName] = useMemo(() => {
		if (!connectionType) return [];

		return [
			getConnectionTypeIcon(connectionType),
			getConnectionTypeDisplayName(connectionType),
		];
	}, [connectionType]);

	return (
		<div
			style={{
				"--connection-type-color": connectionType?.color,
			}}
		>
			<div className="friends-carousel-tile">
				<div>
					<div ref={ref}>
						<button type="button" className="options-dropdown" id="friend-tile-button">
							<Popover
								show={showPopover ? true : undefined}
								placement="bottom"
								container={ref}
								className={classNames("roseal-friend-tile-dropdown", {
									"in-game": isInGame,
								})}
								rootClose={false}
								onEnter={
									checkJoinStatusEnabled && isInGame
										? () => {
												determineCanJoinUser({
													userIdToFollow: userId,
												}).then(setJoinStatus);
											}
										: undefined
								}
								button={
									<div className="friend-tile-content">
										<AvatarCardHeadshot
											imageLink={profileLink}
											statusIcon={
												presenceData && (
													<PresenceStatusIcon
														presence={presenceData}
														href={presencePlaceLink}
													/>
												)
											}
											thumbnail={
												<Thumbnail
													request={{
														type: "AvatarHeadShot",
														size: "420x420",
														targetId: userId,
													}}
													containerClassName="avatar-card-image"
												/>
											}
										/>
										<a
											href={profileLink}
											className="friends-carousel-tile-labels"
											data-testid="friends-carousel-tile-labels"
										>
											<div className="friends-carousel-tile-label">
												{connectionType && (
													<div className="friend-carousel-tile-connection-type">
														{connectionTypeIcon && (
															<div
																className="connection-type-icon-container"
																key={connectionType.id}
															>
																{connectionTypeIcon}
															</div>
														)}
														{connectionTypeName && (
															<div className="connection-type-name-container">
																{connectionTypeName}
															</div>
														)}
													</div>
												)}
												<div className="friends-carousel-tile-name">
													<span className="friends-carousel-display-name">
														{profileData?.names.combinedName}
													</span>
													{profileData?.isVerified && (
														<div className="friend-tile-verified-badge">
															<div className="friend-tile-spacer" />
															<span className="verified-badge">
																<VerifiedBadge
																	width={16}
																	height={16}
																/>
															</span>
														</div>
													)}
												</div>
												{cardUsernameEnabled && (
													<div className="friends-carousel-tile-username">
														<span className="friends-carousel-user-name">
															{getMessage(
																"connectionsCarousel.card.username",
																{
																	username:
																		profileData?.names
																			.username ?? "",
																},
															)}
														</span>
													</div>
												)}
											</div>
											{isInGame &&
												!isInBlockedGame &&
												presenceText !== undefined && (
													<div className="friends-carousel-tile-sublabel">
														<div className="friends-carousel-tile-experience">
															{presenceText}
														</div>
													</div>
												)}
										</a>
									</div>
								}
							>
								<div
									className="friend-tile-dropdown"
									onMouseEnter={() => setShowPopover(true)}
									onMouseLeave={() => setShowPopover(false)}
								>
									{isInBlockedGame && !bypassBlockedView && (
										<div className="in-game-friend-card">
											<div className="friend-tile-game-card-container">
												<div className="friend-tile-game-card">
													<MdOutlineBlock className="roseal-icon game-card-thumb" />
												</div>
											</div>
											<div className="friend-presence-info">
												<span>
													{getMessage(
														"connectionsCarousel.card.blockedExperience.name",
													)}
												</span>
												<Button
													type="control"
													width="full"
													size="sm"
													onClick={() => setBypassBlockedView(true)}
												>
													{getMessage(
														"connectionsCarousel.card.blockedExperience.buttons.action",
													)}
												</Button>
											</div>
										</div>
									)}
									{isInGame && (!isInBlockedGame || bypassBlockedView) && (
										<a
											className="in-game-friend-card"
											href={getExperienceLink(presenceData.placeId!)}
										>
											<div className="friend-tile-game-card-container">
												<Thumbnail
													request={{
														type: "PlaceIcon",
														targetId: presenceData.placeId!,
														size: "256x256",
													}}
													imgClassName="game-card-thumb"
													containerClassName="friend-tile-game-card"
												/>
											</div>
											<div className="friend-presence-info">
												<span>{presenceData.lastLocation}</span>
												<Button
													type="growth"
													width="full"
													size="sm"
													disabled={
														checkJoinStatusEnabled &&
														joinStatus?.disabled !== false
													}
													className={classNames({
														"roseal-grayscale":
															joinStatus?.disabled === true,
													})}
													onClick={joinUser}
												>
													{joinStatus?.message ||
														getMessage(
															"connectionsCarousel.card.experience.buttons.action",
														)}
												</Button>
											</div>
										</a>
									)}
									<ul>
										{canChat && (
											<li>
												<button
													type="button"
													className="friend-tile-dropdown-button"
													onClick={startChat}
												>
													<Icon name="chat-gray" />{" "}
													{getMessage(
														"connectionsCarousel.card.actions.chatWith",
														{
															displayName:
																profileData?.names.combinedName ??
																"",
														},
													)}
												</button>
											</li>
										)}
										<li>
											<button
												type="button"
												className="friend-tile-dropdown-button"
												onClick={viewProfile}
											>
												<Icon name="viewdetails" />{" "}
												{getMessage(
													"connectionsCarousel.card.actions.viewProfile",
												)}
											</button>
										</li>
									</ul>
								</div>
							</Popover>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

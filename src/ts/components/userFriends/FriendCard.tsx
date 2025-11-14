import classNames from "classnames";
import type { ComponentChild, VNode } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import {
	type FRIEND_REQUESTS_FILTER_SORTS,
	MUTUAL_FRIENDS_SHOW_COUNT,
} from "src/ts/constants/friends";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString, getShortRelativeTime } from "src/ts/helpers/i18n/intlFormats";
import {
	acceptUserFriendRequest,
	declineUserFriendRequest,
	requestUserFriendship,
	type UserFriendRequestData,
	type UserPresence,
} from "src/ts/helpers/requests/services/users";
import {
	getMyUserFriendshipCreationDate,
	getUserFriendshipCreationDate,
} from "src/ts/utils/friends";
import { getExperienceLink, getUserProfileLink } from "src/ts/utils/links";
import AvatarCardButtons from "../core/avatarCard/CardButtons";
import AvatarCardCaption from "../core/avatarCard/CardCaption";
import AvatarCardCaptionFooter from "../core/avatarCard/CardCaptionFooter";
import AvatarCardContent from "../core/avatarCard/CardContent";
import AvatarCardHeadshot from "../core/avatarCard/CardHeadshot";
import AvatarCardItem from "../core/avatarCard/CardItem";
import Button from "../core/Button";
import PresenceStatusIcon, { PresenceStatusLabel } from "../core/presence/StatusIcon";
import Thumbnail from "../core/Thumbnail";
import Tooltip from "../core/Tooltip";
import useFeatureValue from "../hooks/useFeatureValue";
import usePresence from "../hooks/usePresence";
import useProfileData, { type UserProfileResponse } from "../hooks/useProfileData";
import FriendCardContextMenu from "./FriendCardContextMenu";
import type { FriendCardTypesProps } from "./FriendCardType";
import type { FriendsTabType, SourceUniverseData } from "./Page";
import type { UserFriendRequestAdditionalComponents } from "./tabs/FriendRequestsTab";

export type FriendCardPageData = {
	cursor?: string;
	index: number;
};

export type FriendCardProps = {
	id: number;
	pageUserId: number;
	sourceUniverse?: SourceUniverseData;
	friendSince?: Date;
	friendRequest?: UserFriendRequestData;
	currentTab: FriendsTabType;
	isMyProfile: boolean;
	friendPresence?: UserPresence;
	isFriends?: boolean;
	showSendFriendRequest?: boolean;
	mutualFriends?: string[];
	pageData?: FriendCardPageData;
	hasPlayedWith?: boolean;
	requestsSortType?: (typeof FRIEND_REQUESTS_FILTER_SORTS)[number];
	components?: UserFriendRequestAdditionalComponents;
	setFriendSince?: (date: Date) => void;
	removeCard: () => void;
} & Partial<FriendCardTypesProps>;

export default function FriendCard({
	id,
	pageUserId,
	friendRequest,
	sourceUniverse,
	currentTab,
	isMyProfile,
	friendPresence,
	isFriends,
	friendSince,
	showSendFriendRequest,
	mutualFriends,
	pageData,
	hasPlayedWith,
	connectionType,
	availableConnectionTypes,
	requestsSortType,
	components,
	updateConnectionTypesLayout,
	openCreateType,
	openEditType,
	setConnectionType,
	setFriendSince,
	removeCard,
}: FriendCardProps) {
	const isHiddenProfile = id < 0;

	const [isSendingRequest, setIsSendingRequest] = useState(false);
	const [extendedFriendCardMenuEnabled] = useFeatureValue("userFriendsMoreActions", false);
	const _profileData = useProfileData(
		!isHiddenProfile
			? {
					userId: id,
				}
			: undefined,
	);
	const profileData = !isHiddenProfile
		? _profileData
		: ({
				userId: id,
				names: {
					combinedName: getMessage("friends.card.profileHidden"),
					displayName: getMessage("friends.card.profileHidden"),
					username: getMessage("friends.card.profileHidden"),
				},
				isVerified: false,
				isDeleted: false,
			} satisfies UserProfileResponse);
	const [showFriendRequestSentAtText] = useFeatureValue(
		"improvedUserFriendsPage.showFriendRequestSentAt",
		false,
	);
	const [getAccurateFriendDateEnabled] = useFeatureValue(
		"improvedUserFriendsPage.getAccurateFriendDate",
		false,
	);
	const presenceData = usePresence(isHiddenProfile ? undefined : id, friendPresence);

	const profileUrl =
		!isHiddenProfile && !profileData?.isDeleted ? getUserProfileLink(id) : undefined;
	/*
	const presenceType = presenceTypes.find(
		(type) => type.typeId === presenceData?.userPresenceType,
	);*/
	const presencePlaceId = presenceData?.placeId;
	const presencePlaceLink = presencePlaceId ? getExperienceLink(presencePlaceId) : undefined;
	const sourcePlaceLink =
		sourceUniverse?.data &&
		getExperienceLink(sourceUniverse.data.rootPlaceId, sourceUniverse.data.name);

	let firstLineText: VNode | undefined | string = presenceData && (
		<PresenceStatusLabel
			presence={presenceData}
			universe={sourceUniverse?.data}
			linkClassName="avatar-status-link text-link"
			href={presencePlaceLink}
		/>
	);
	let secondLineText: VNode | undefined | string;
	let footer: unknown | undefined;
	let truncateFirstLine = false;

	const isFriendsTab = currentTab === "friends" || currentTab === "trusted-friends";
	const hasBtn = isMyProfile && (currentTab === "friend-requests" || showSendFriendRequest);

	const menuJustFriendsDate =
		!isMyProfile && isFriendsTab && getAccurateFriendDateEnabled && !friendSince;
	const hasMenu =
		((isMyProfile &&
			(extendedFriendCardMenuEnabled ||
				profileData?.isDeleted ||
				currentTab === "following")) ||
			menuJustFriendsDate) &&
		id > 0;

	/*
	const presenceStatusGame = useMemo(() => {
		if (friendRequest) {
			return;
		}

		if (sourceUniverse?.isPlayable) {
			return {
				truncateFirstLine: true,
				footer: (
					<Button
						onClick={() => {
							blankDOMCall(["Roblox", "GameLauncher", "followPlayerIntoGame"], [id]);
						}}
						size="sm"
						width="full"
						type="growth"
					>
						Join
					</Button>
				),
			};
		}

		return {
			truncateFirstLine: false,
			footer: null,
		};
	}, [sourceUniverse, friendRequest]);*/

	const sortFilterText = useMemo(() => {
		if (
			!components &&
			requestsSortType !== "mutualConnectionsCount" &&
			requestsSortType !== "sentDate"
		) {
			return null;
		}

		switch (requestsSortType) {
			/*
			case "mutualCommunitiesCount": {
				return (
					<span className="mutual-friends-tooltip-label">
						{getMessage("friends.card.mutualCommunities", {
							countNum: components!.mutualCommunitiesCount,
							count: asLocaleString(components!.mutualCommunitiesCount),
						})}
					</span>
				);
			}*/

			case "connectionsCount": {
				return (
					<span className="mutual-friends-tooltip-label">
						{getMessage("friends.card.connectionsCount", {
							countNum: components!.connectionsCount,
							count: asLocaleString(components!.connectionsCount),
						})}
					</span>
				);
			}
			case "followingsCount": {
				return (
					<span className="mutual-friends-tooltip-label">
						{getMessage("friends.card.followingsCount", {
							count: asLocaleString(components!.followingsCount),
						})}
					</span>
				);
			}
			/*
			case "joinedDate": {
				if (!components?.joinedDate) return null;

				return (
					<span className="mutual-friends-tooltip-label">
						{getMessage("friends.card.joinedDate", {
							date: getRegularTime(components!.joinedDate * 1_000),
						})}
					</span>
				);
			}*/
			case "followersCount": {
				return (
					<span className="mutual-friends-tooltip-label">
						{getMessage("friends.card.followersCount", {
							countNum: components!.followersCount,
							count: asLocaleString(components!.followersCount),
						})}
					</span>
				);
			}

			default: {
				if (!mutualFriends?.length) {
					return null;
				}

				const listItems: ComponentChild[] = [];
				for (const item of mutualFriends) {
					if (listItems.length >= MUTUAL_FRIENDS_SHOW_COUNT) {
						const remainingCount = mutualFriends.length - MUTUAL_FRIENDS_SHOW_COUNT;
						const remainingCountMessage = getMessage("friends.card.plusMore", {
							count: asLocaleString(remainingCount),
						});

						listItems.push(<li className="text-overflow">{remainingCountMessage}</li>);
						break;
					}

					listItems.push(<li className="text-overflow">{item}</li>);
				}

				return (
					<Tooltip
						id="mutual-friends-tooltip"
						placement="bottom"
						button={
							<span className="mutual-friends-tooltip-label">
								{getMessage("friends.card.mutualFriends", {
									countNum: mutualFriends.length,
									count: asLocaleString(mutualFriends.length),
								})}
							</span>
						}
					>
						{listItems}
					</Tooltip>
				);
			}
		}
	}, [mutualFriends, requestsSortType, components]);

	const gameContextFooter = useMemo(() => {
		return getMessage("friends.card.sentFrom.experience", {
			experience: (
				<a href={sourcePlaceLink} className="text-link avatar-card-footer-link">
					{sourceUniverse?.data?.name}
				</a>
			),
		});
	}, [sourceUniverse?.data?.name]);

	if (isFriendsTab) {
		// previous check here was for showing is unfollowed in following tab
		/*
		if (presenceType?.type === "InGame" && presenceStatusGame) {
			({ truncateFirstLine, footer } = presenceStatusGame);
		}*/

		if (friendSince) {
			const time = asLocaleString(friendSince);
			const relativeTime = getShortRelativeTime(friendSince);

			secondLineText = (
				<Tooltip
					includeContainerClassName={false}
					button={
						<span>
							{getMessage("friends.card.friendshipCreatedTime", {
								time: relativeTime,
							})}
						</span>
					}
				>
					{time}
				</Tooltip>
			);
			truncateFirstLine = true;
		}
	} else if (currentTab === "friend-requests") {
		if (
			showFriendRequestSentAtText &&
			friendRequest?.sentAt &&
			friendRequest?.sentAt !== "0001-01-01T05:51:00Z" &&
			profileData?.names.username
		) {
			firstLineText = getMessage("friends.card.sentAt", {
				time: asLocaleString(new Date(friendRequest.sentAt)),
			});
		}

		if (sortFilterText) {
			footer = sortFilterText;
		} else if (sourceUniverse?.data) {
			footer = gameContextFooter;
		} else if (friendRequest) {
			const key = `friends.card.sentFrom.other.${friendRequest?.originSourceType}`;

			if (hasMessage(key)) footer = getMessage(key);
		} else if (hasPlayedWith) {
			footer = getMessage("friends.card.playedWith");
		}
	}

	// regardless of tab, if user is deleted, show presence 'Inactive'
	if (profileData?.isDeleted) {
		firstLineText = getMessage("friends.card.deleted");
	}

	useEffect(() => {
		if (
			getAccurateFriendDateEnabled &&
			isMyProfile &&
			currentTab === "trusted-friends" &&
			setFriendSince
		) {
			getMyUserFriendshipCreationDate(id).then((data) => {
				if (data) setFriendSince?.(data);
			});
		}
	}, [getAccurateFriendDateEnabled, isMyProfile, id]);

	return (
		<AvatarCardItem
			id={id.toString()}
			className={classNames({
				"has-color": connectionType?.color,
			})}
			disableCard={profileData?.isDeleted || isSendingRequest || id < 1}
			style={{
				"--avatar-card-color": connectionType?.color,
			}}
		>
			<AvatarCardContent>
				<AvatarCardHeadshot
					imageLink={profileUrl}
					statusIcon={
						!isHiddenProfile &&
						presenceData && (
							<PresenceStatusIcon presence={presenceData} href={presencePlaceLink} />
						)
					}
					thumbnail={
						<Thumbnail
							request={
								id > 0
									? {
											type: "AvatarHeadShot",
											size: "420x420",
											targetId: id,
										}
									: undefined
							}
							data={
								id < 1
									? {
											state: "Blocked",
										}
									: undefined
							}
							containerClassName="avatar-card-image"
						/>
					}
				/>

				<AvatarCardCaption
					username={
						!isHiddenProfile && !profileData?.isDeleted
							? profileData?.names.username
							: undefined
					}
					isHidden={isHiddenProfile || profileData?.isDeleted}
					displayName={friendRequest?.senderNickname || profileData?.names.combinedName}
					hasVerifiedBadge={profileData?.isVerified}
					usernameLink={!profileData?.isDeleted ? profileUrl : undefined}
					labelFirstLine={firstLineText}
					labelSecondLine={secondLineText}
					footer={
						footer ? (
							<AvatarCardCaptionFooter>{footer}</AvatarCardCaptionFooter>
						) : undefined
					}
					hasMenu={hasMenu}
					truncateFirstLine={truncateFirstLine}
					availableConnectionTypes={availableConnectionTypes}
					updateConnectionTypesLayout={updateConnectionTypesLayout}
					connectionType={connectionType}
					userId={id}
					setConnectionType={setConnectionType}
					openCreateType={openCreateType}
					openEditType={openEditType}
				/>

				{hasMenu && (
					<FriendCardContextMenu
						isMyProfile={isMyProfile}
						tabId={currentTab}
						userId={id}
						isFriends={isFriends && !menuJustFriendsDate}
						isDeleted={profileData?.isDeleted && !menuJustFriendsDate}
						hideCard={removeCard}
						showOtherOptions={extendedFriendCardMenuEnabled && !menuJustFriendsDate}
						onClickGetFriendDate={async () => {
							if (isMyProfile) {
								const data = await getMyUserFriendshipCreationDate(id);
								if (data) {
									return setFriendSince?.(data);
								}
							}

							getUserFriendshipCreationDate(
								pageUserId,
								id,
								pageData?.cursor,
								pageData ? pageData.index + 1 : undefined,
							).then((data) => {
								if (data) {
									setFriendSince?.(data);
								}
							});
						}}
						showGetFriendDate={!friendSince && getAccurateFriendDateEnabled}
					/>
				)}
			</AvatarCardContent>
			{hasBtn && (
				<AvatarCardButtons>
					{showSendFriendRequest ? (
						<Button
							isLoading={isSendingRequest}
							className="send-friend-request"
							onClick={() => {
								setIsSendingRequest(true);
								requestUserFriendship({
									userId: id,
								})
									.then(removeCard)
									.finally(() => {
										setIsSendingRequest(false);
									});
							}}
							type="control"
							size="md"
							width="full"
						>
							{getMessage("friends.card.buttons.sendFriendRequest")}
						</Button>
					) : (
						<>
							<Button
								isLoading={isSendingRequest}
								className={classNames("ignore-friend", {
									"full-width": profileData?.isDeleted,
								})}
								onClick={() => {
									setIsSendingRequest(true);
									declineUserFriendRequest({
										userId: id,
									})
										.then(removeCard)
										.finally(() => {
											setIsSendingRequest(false);
										});
								}}
								type="secondary"
								size="md"
							>
								{getMessage("friends.card.buttons.ignore")}
							</Button>
							{!profileData?.isDeleted && (
								<Button
									isLoading={isSendingRequest}
									className="accept-friend"
									onClick={() => {
										setIsSendingRequest(true);
										acceptUserFriendRequest({
											userId: id,
										})
											.then(removeCard)
											.finally(() => {
												setIsSendingRequest(false);
											});
									}}
									type="cta"
									size="md"
								>
									{getMessage("friends.card.buttons.accept")}
								</Button>
							)}
						</>
					)}
				</AvatarCardButtons>
			)}
		</AvatarCardItem>
	);
}

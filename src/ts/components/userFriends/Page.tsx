import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { UniverseDetail } from "src/ts/helpers/requests/services/universes";
import { listMyNewFriendRequestsCount } from "src/ts/helpers/requests/services/users";
import { getCanViewUserFriends } from "src/ts/utils/friends";
import TabsContainer from "../core/tab/Container";
import TabContent from "../core/tab/Content";
import TabContents from "../core/tab/Contents";
import TabNavs from "../core/tab/Navs";
import SimpleTabNav from "../core/tab/SimpleNav";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import useOnlineFriends from "../hooks/useOnlineFriends";
import useProfileData from "../hooks/useProfileData";
import usePromise from "../hooks/usePromise";
import FollowersTab from "./tabs/FollowersTab";
import FollowingsTab from "./tabs/FollowingsTab";
import FriendRequestsTab from "./tabs/FriendRequestsTab";
import FriendsTab from "./tabs/FriendsTab";
import MutualsTab from "./tabs/MutualsTab";
import TrustedFriendsTab from "./tabs/TrustedFriendsTab";
import { getFeatureAccess } from "src/ts/helpers/requests/services/testService";

export type UserFriendsPageProps = {
	isMyProfile: boolean;
	userId: number;
};

export type FriendsTabType =
	| "friends"
	| "trusted-friends"
	| "following"
	| "followers"
	| "friend-requests"
	| "mutuals";

export type SourceUniverseData = {
	data?: UniverseDetail;
	isPlayable?: boolean;
};

export default function UserFriendsPage({ userId, isMyProfile }: UserFriendsPageProps) {
	const [authenticatedUser, fetchedAuthenticatedUser] = useAuthenticatedUser();
	const [showTargetUsername] = useFeatureValue("userPagesNewTitle", false);
	const [mututalsTabEnabled] = useFeatureValue("improvedUserFriendsPage.mutualsTab", false);
	const [trustedFriendsTabEnabled] = useFeatureValue(
		"improvedUserFriendsPage.trustedConnectionsTab",
		undefined,
	);

	const [canViewTrustedFriends] = usePromise(
		() =>
			trustedFriendsTabEnabled &&
			getFeatureAccess({
				featureName: "CanAccessTrustedContacts",
			}),
		[trustedFriendsTabEnabled],
	);

	const [canViewUserFriends] = usePromise(() => getCanViewUserFriends(userId), [userId]);

	const mustHideConnections =
		authenticatedUser?.userId !== userId && canViewUserFriends === false;
	const mustHideConnectionsContent =
		authenticatedUser?.userId !== userId && canViewUserFriends !== true;

	const [newFriendRequestCount, , , refreshNewFriendRequestsCount] = usePromise(
		() => listMyNewFriendRequestsCount().then((data) => data.count),
		[],
		false,
	);

	const [myOnlineFriends, myOnlineFriendsFetched] = useOnlineFriends();
	const profileInfo = useProfileData({
		userId,
	});

	const canAccessRequests = isMyProfile;
	const canAccessFriends = !!authenticatedUser;
	const canAccessMutuals = !isMyProfile && !!authenticatedUser;
	const canAccessTrustedFriends =
		isMyProfile && canViewTrustedFriends && canViewTrustedFriends.access === "Granted";

	const [activeTab, setActiveTab] = useState<FriendsTabType>(
		(location.hash.split("/")[1] || "friends") as FriendsTabType,
	);

	useEffect(() => {
		if (!fetchedAuthenticatedUser) {
			return;
		}

		let newTab: FriendsTabType | undefined;

		if (
			activeTab === "trusted-friends" &&
			canViewTrustedFriends !== undefined &&
			!canAccessTrustedFriends &&
			trustedFriendsTabEnabled !== undefined
		) {
			newTab = "friends";
		}
		if (activeTab === "friends" && !canAccessFriends) {
			newTab = "followers";
		}
		if (activeTab === "friend-requests" && !canAccessRequests) {
			newTab = "followers";
		}
		if (activeTab === "mutuals" && !canAccessMutuals) {
			newTab = "friends";
		}

		if (newTab) {
			setActiveTab(newTab);
			location.hash = `#!/${newTab}`;
		}
	}, [
		activeTab,
		canAccessFriends,
		canAccessRequests,
		canAccessTrustedFriends,
		fetchedAuthenticatedUser,
		canAccessMutuals,
	]);

	const tabClassName = classNames({
		"subtract-item": !canAccessRequests,
		"signed-out": !canAccessFriends,
		"add-mutuals": canAccessMutuals && mututalsTabEnabled,
		"add-trusted-friends": canAccessTrustedFriends,
	});

	useEffect(() => {
		const listener = () => {
			const hash = location.hash.split("/")[1] || "friends";
			setActiveTab(hash as FriendsTabType);
		};

		globalThis.addEventListener("hashchange", listener);
		return () => {
			globalThis.removeEventListener("hashchange", listener);
		};
	}, []);

	return (
		<div className="row page-content">
			<div className="page-header section">
				<div className="container-header">
					<h1 className="friends-title">
						{isMyProfile
							? getMessage("friends.myTitle")
							: getMessage(
									`friends.${showTargetUsername ? "newTitle" : "regularTitle"}`,
									{
										username: profileInfo?.names.username ?? "",
										displayName: profileInfo?.names.combinedName ?? "",
									},
								)}
					</h1>
				</div>
			</div>
			{mustHideConnections ? (
				<p className="section-content-off">{getMessage("friends.notAllowed")}</p>
			) : (
				<div className="section">
					<TabsContainer isScrollable>
						<TabNavs>
							{canAccessFriends && (
								<SimpleTabNav
									id="friends"
									title={getMessage("friends.tabs.friends")}
									className={tabClassName}
									active={activeTab === "friends"}
									link="#!/friends"
								/>
							)}
							{canAccessTrustedFriends && trustedFriendsTabEnabled && (
								<SimpleTabNav
									id="trusted-friends"
									title={getMessage("friends.tabs.trustedFriends")}
									className={tabClassName}
									active={activeTab === "trusted-friends"}
									link="#!/trusted-friends"
								/>
							)}
							<SimpleTabNav
								id="following"
								title={getMessage("friends.tabs.following")}
								className={tabClassName}
								active={activeTab === "following"}
								link="#!/following"
							/>
							<SimpleTabNav
								id="followers"
								title={getMessage("friends.tabs.followers")}
								className={tabClassName}
								active={activeTab === "followers"}
								link="#!/followers"
							/>
							{canAccessRequests && (
								<SimpleTabNav
									id="requests"
									title={getMessage("friends.tabs.friendRequests")}
									className={tabClassName}
									active={activeTab === "friend-requests"}
									link="#!/friend-requests"
								>
									{!!newFriendRequestCount && (
										<span className="notification-blue notification">
											{newFriendRequestCount}
										</span>
									)}
								</SimpleTabNav>
							)}
							{canAccessMutuals && mututalsTabEnabled && (
								<SimpleTabNav
									id="mutuals"
									title={getMessage("friends.tabs.mutuals")}
									className={tabClassName}
									active={activeTab === "mutuals"}
									link="#!/mutuals"
								/>
							)}
						</TabNavs>
					</TabsContainer>
					{!mustHideConnectionsContent && (
						<TabContents>
							<TabContent isActive>
								{canAccessFriends && activeTab === "friends" && (
									<FriendsTab
										userId={userId}
										onlineFriends={isMyProfile ? myOnlineFriends : undefined}
										onlineFriendsFetched={myOnlineFriendsFetched}
										isMyProfile={isMyProfile}
									/>
								)}
								{canAccessTrustedFriends && activeTab === "trusted-friends" && (
									<TrustedFriendsTab
										userId={userId}
										onlineFriends={myOnlineFriends}
									/>
								)}
								{activeTab === "following" && (
									<FollowingsTab userId={userId} isMyProfile={isMyProfile} />
								)}
								{activeTab === "followers" && (
									<FollowersTab userId={userId} isMyProfile={isMyProfile} />
								)}
								{canAccessRequests && activeTab === "friend-requests" && (
									<FriendRequestsTab
										userId={userId}
										refreshNewFriendRequestsCount={
											refreshNewFriendRequestsCount
										}
									/>
								)}
								{canAccessMutuals && activeTab === "mutuals" && (
									<MutualsTab userId={userId} />
								)}
							</TabContent>
						</TabContents>
					)}
				</div>
			)}
		</div>
	);
}

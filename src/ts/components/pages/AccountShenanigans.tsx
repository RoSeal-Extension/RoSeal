import { useMemo } from "preact/hooks";
import {
	APPLICATION_BINARY_TYPES,
	TEST_PLACE_ID,
	TEST_RCC_CHANNEL_NAME,
	VOTING_ITEM_TYPES,
} from "src/ts/constants/misc";
import { ROBLOX_ADMINISTRATOR_BADGE_ID } from "src/ts/constants/profile";
import {
	getPublicRoles,
	getUserHydratedPlayerInfo,
	getUserPlayStationSettings,
	getUserSettings,
	getUserSettingsAndOptions,
	listTestPilotPrograms,
} from "src/ts/helpers/requests/services/account";
import {
	getMatchmadeServerData,
	JoinServerStatusCode,
} from "src/ts/helpers/requests/services/join";
import { getRealtimeSubscriptionEventCounts } from "src/ts/helpers/requests/services/notifications";
import {
	type GetUserEnrollmentChannelResponse,
	getLayersValues,
	getUserEnrollmentChannel,
} from "src/ts/helpers/requests/services/testService";
import { listUserRobloxBadges } from "src/ts/helpers/requests/services/users";
import { getCurrentUserVoteCount } from "src/ts/helpers/requests/services/voting";
import { getDeviceMeta, getPlaceLauncherData } from "src/ts/utils/context";
import { getUserAccountIdBTID } from "src/ts/utils/cookies";
import { tryGetServerJoinData } from "src/ts/utils/joinData";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";

export default function AccountShenanigansContainer() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [accountType] = usePromise(() => {
		if (!authenticatedUser) return;

		return Promise.all([
			listUserRobloxBadges({
				userId: authenticatedUser.userId,
			}),
			getPublicRoles(),
			tryGetServerJoinData(
				getMatchmadeServerData,
				{
					placeId: TEST_PLACE_ID,
					channelName: TEST_RCC_CHANNEL_NAME,
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
				},
				1,
			),
		]).then(([robloxBadges, publicRoles, joinServerResponse]) => {
			if (robloxBadges.find((badge) => badge.id === ROBLOX_ADMINISTRATOR_BADGE_ID)) {
				return "Roblox Administrator";
			}

			if (publicRoles.roles.includes("Soothsayer")) {
				return "Soothsayer";
			}

			if (joinServerResponse.statusCode === JoinServerStatusCode.ChannelMismatch) {
				return "Roblox Beta Tester";
			}

			if (publicRoles.roles.includes("BetaTester")) {
				return "Legacy Roblox Beta Tester";
			}

			return "Regular User";
		});
	}, [authenticatedUser?.userId]);
	const [channels] = usePromise(async () => {
		const channels: Record<string, Promise<GetUserEnrollmentChannelResponse>> = {
			default: getUserEnrollmentChannel({}),
		};
		for (const binaryType of APPLICATION_BINARY_TYPES) {
			channels[binaryType] = getUserEnrollmentChannel({
				binaryType,
			});
		}

		const data: (GetUserEnrollmentChannelResponse & {
			binaryType: string;
		})[] = [];
		for (const key in channels) {
			const value = await channels[key];
			if (value.channelName === "LIVE") continue;
			data.push({
				...value,
				binaryType: key,
			});
		}

		return data;
	}, []);
	const [votingCounts] = usePromise(() => {
		return Promise.all(
			VOTING_ITEM_TYPES.map((itemType) =>
				getCurrentUserVoteCount({
					targetType: itemType,
				}),
			),
		);
	}, []);
	const [platformData] = usePromise(
		() =>
			getLayersValues({
				layers: {
					PlaceholderLayer: {},
				},
			}).then((data) => ({
				platformType: data.platformType,
				platformTypeId: data.platformTypeId,
			})),
		[],
	);
	const userAccountIdBTID = useMemo(getUserAccountIdBTID, []);
	const [deviceMeta] = usePromise(getDeviceMeta);
	const [placeLauncherData] = usePromise(getPlaceLauncherData);
	const [userSettings] = usePromise(getUserSettings);
	const [userSettingsOptions] = usePromise(getUserSettingsAndOptions);
	const [userPlayStationSettings] = usePromise(getUserPlayStationSettings);
	const [hydratedPlayerInfo] = usePromise(() =>
		getUserHydratedPlayerInfo().then((data) => {
			return {
				...data,
				playerInfo: {
					...data.playerInfo,
					originalAccountCreationTimestampMs: `${data.playerInfo.originalAccountCreationTimestampMs
						.toString()
						.slice(0, 3)}...`,
				},
				signature: `${data.signature.slice(0, 5)}...`,
			};
		}),
	);
	const [realtimeEventCounts] = usePromise(getRealtimeSubscriptionEventCounts);
	const [testPilotPrograms] = usePromise(listTestPilotPrograms);

	return (
		<div className="account-shenanigans">
			<div className="container-header">
				<h1>{accountType || "Roblox User"}</h1>
			</div>
			<div className="section-list">
				<div className="section">
					<div className="container-header">
						<h4>Channels</h4>
					</div>
					<pre className="section-content">{JSON.stringify(channels, null, 4)}</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Voting Counts</h4>
					</div>
					<pre className="section-content">{JSON.stringify(votingCounts, null, 4)}</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Platform Data</h4>
					</div>
					<pre className="section-content">{JSON.stringify(platformData, null, 4)}</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Device Meta</h4>
					</div>
					<pre className="section-content">{JSON.stringify(deviceMeta, null, 4)}</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Place Launcher Data</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(placeLauncherData, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>User Account ID & Browser Tracker ID</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(userAccountIdBTID, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Authenticated User</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(authenticatedUser, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>User Settings</h4>
					</div>
					<pre className="section-content">{JSON.stringify(userSettings, null, 4)}</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>User Settings and Options #2</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(userSettingsOptions, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>User PlayStation Settings</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(userPlayStationSettings, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Hydrated Player Info</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(hydratedPlayerInfo, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Realtime Event Counts</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(realtimeEventCounts, null, 4)}
					</pre>
				</div>
				<div className="section">
					<div className="container-header">
						<h4>Test Pilot Programs</h4>
					</div>
					<pre className="section-content">
						{JSON.stringify(testPilotPrograms, null, 4)}
					</pre>
				</div>
			</div>
		</div>
	);
}

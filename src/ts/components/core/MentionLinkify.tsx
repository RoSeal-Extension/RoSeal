import { type Signal, useSignal } from "@preact/signals";
import type { JSX } from "preact";
import { useEffect } from "preact/hooks";
import {
	profileProcessor,
	type UserProfileRequest,
	type UserProfileResponse,
} from "src/ts/helpers/processors/profileProcessor.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import processString from "src/ts/utils/processString.ts";
import {
	GROUP_DETAILS_REGEX,
	USER_PROFILE_REGEX,
	USERNAME_MENTION_REGEX,
} from "src/ts/utils/regex.ts";
import { type GroupV2, multigetGroupsByIds } from "../../helpers/requests/services/groups.ts";
import { multigetUsersByNames, type RequestedUser } from "../../helpers/requests/services/users.ts";
import { getPath } from "../../utils/url.ts";
import AgentMentionContainer from "./items/AgentMentionContainer.tsx";
import { type LinkifyProps, linkifyStringFn } from "./Linkify.tsx";

type ProcessMentionLinkifyData = LinkifyProps & {
	userDataByName: Signal<Record<string, RequestedUser>>;
	usernamesToQuery: string[];
	groupIdsToQuery: number[];
	usersToQuery: UserProfileRequest[];
	userData: Signal<UserProfileResponse[]>;
	groupData: Signal<GroupV2[]>;
};

const processMentionLinkifyString = processString<ProcessMentionLinkifyData>([
	{
		regex: linkifyStringFn.regex,
		fn: (index, result, data) =>
			linkifyStringFn.fn(index, result, {
				...data,
				// @ts-expect-error: Fine, works
				render: (url, data: ProcessMentionLinkifyData) => {
					if (url.hostname.endsWith(getRobloxUrl(""))) {
						const path = getPath(url.pathname);

						const userMatch = path.realPath.match(USER_PROFILE_REGEX)?.[1];
						const groupMatch = path.realPath.match(GROUP_DETAILS_REGEX)?.[2];

						if (userMatch) {
							const userId = Number.parseInt(userMatch, 10);
							for (const user of data!.userData.value) {
								if (user.userId === userId) {
									return (
										<AgentMentionContainer
											key={`user-${user.userId}`}
											targetId={user.userId}
											name={user.names.username}
											targetType="User"
											hasVerifiedBadge={user.isVerified}
										/>
									);
								}
							}

							data!.usersToQuery.push({
								userId: Number.parseInt(userMatch, 10),
							});
						} else if (groupMatch) {
							const groupId = Number.parseInt(groupMatch, 10);
							for (const group of data!.groupData.value) {
								if (group.id === groupId) {
									return (
										<AgentMentionContainer
											key={`group-${group.id}`}
											targetId={group.id}
											name={group.name}
											targetType="Group"
											hasVerifiedBadge={group.hasVerifiedBadge}
											tab={url.hash.split("#!/")[1]}
										/>
									);
								}
							}

							data!.groupIdsToQuery.push(Number.parseInt(groupMatch, 10));
						}
					}
				},
			}),
	},
	{
		regex: USERNAME_MENTION_REGEX,
		fn: (_, result, data) => {
			const username = result[1].toLowerCase();

			const user = data?.userDataByName.value[username];
			if (user) {
				return (
					<AgentMentionContainer
						key={`user-${user.id}`}
						targetId={user.id}
						name={user.name}
						targetType="User"
						hasVerifiedBadge={user.hasVerifiedBadge}
					/>
				);
			}

			data?.usernamesToQuery.push(username);
			return result[0];
		},
	},
]);

export type MentionLinkifyProps = {
	content?: string | null;
};

export default function MentionLinkify({ content }: MentionLinkifyProps) {
	const userDataByName = useSignal<Record<string, RequestedUser>>({});
	const userData = useSignal<UserProfileResponse[]>([]);
	const groupData = useSignal<GroupV2[]>([]);

	const usersToQuery: UserProfileRequest[] = [];
	const groupIdsToQuery: number[] = [];
	const usernamesToQuery: string[] = [];

	useEffect(() => {
		if (usernamesToQuery.length) {
			multigetUsersByNames({
				usernames: usernamesToQuery,
			})
				.then((data) => {
					const newValue = {
						...userDataByName.value,
					};
					for (const item of data) {
						newValue[item.requestedUsername] = item;
					}
					userDataByName.value = newValue;
				})
				.catch(() => {});
		}

		if (usersToQuery.length) {
			profileProcessor.requestBatch(usersToQuery).then((data) => {
				userData.value = [...userData.value, ...data];
			});
		}

		if (groupIdsToQuery.length) {
			multigetGroupsByIds({
				groupIds: groupIdsToQuery,
			})
				.then((data) => {
					groupData.value = [...groupData.value, ...data];
				})
				.catch(() => {});
		}
	}, [content]);

	if (!content) {
		return <></>;
	}

	return processMentionLinkifyString(content, {
		usernamesToQuery,
		groupIdsToQuery,
		usersToQuery,
		userDataByName,
		userData,
		groupData,
	}) as JSX.Element;
}

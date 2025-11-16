import type { Signal } from "@preact/signals";
import { modifyTitle } from "../helpers/elements";
import { getGroupProfileLink } from "./links";
import { sendMessage } from "../helpers/communication/dom";
import { getOrSetCache } from "../helpers/cache";
import { listGroupMembersV2 } from "../helpers/requests/services/groups";
import { tryOpenCloudAuthRequest } from "./cloudAuth";

export function setActiveGroup(
	groupId: Signal<number>,
	groupName: Signal<string>,
	newGroupId: number,
	newGroupName: string,
	pushState = true,
) {
	if (groupId.value === newGroupId) return;

	groupId.value = newGroupId;
	groupName.value = newGroupName;

	if (pushState) {
		modifyTitle(newGroupName);

		let currentHash = location.hash.replace("#!/", "");
		if (currentHash.startsWith("forums") || currentHash === "") {
			if (currentHash.startsWith("forums")) {
				document.body.querySelector<HTMLDivElement>("li#about")?.click();
			}

			currentHash = "about";
		}

		history.pushState(
			undefined,
			"",
			getGroupProfileLink(newGroupId, newGroupName, currentHash),
		);
	}

	sendMessage("group.setActiveGroup", {
		groupId: newGroupId,
	});
}

export function getUserCommunityJoinedDate(
	groupId: number,
	userId: number,
	viewerUserId: number,
	viewerIsUnder13: boolean,
	overrideCache?: boolean,
) {
	return getOrSetCache({
		key: ["communities", groupId, "members", userId, "joinTime"],
		fn: () =>
			tryOpenCloudAuthRequest(viewerUserId, viewerIsUnder13 === false, (credentials) =>
				listGroupMembersV2({
					credentials,
					groupId,
					filter: `user == 'users/${userId}'`,
				}).then((memberships) => memberships.groupMemberships[0]?.createTime),
			),
		overrideCache,
	});
}

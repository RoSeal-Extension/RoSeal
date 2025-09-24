import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect } from "preact/hooks";
import { watch } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	deleteUserGroupMembership,
	listUserPendingGroups,
} from "src/ts/helpers/requests/services/groups";
import { setActiveGroup as _setActiveGroup } from "src/ts/utils/groups";
import { getSearchGroupsLink } from "src/ts/utils/links";
import Loading from "../core/Loading";
import { success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import usePromise from "../hooks/usePromise";
import GroupCard from "./Card";

export type PendingGroupsListProps = {
	groupId: Signal<number>;
	groupName: Signal<string>;
};

export default function PendingGroupsList({ groupId, groupName }: PendingGroupsListProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [refreshlessGroupNavigationEnabled] = useFeatureValue("groupSeamlessNavigation", false);
	const [pendingGroups, , , refetchPendingGroups] = usePromise(
		() => listUserPendingGroups().then((data) => data.data),
		[],
		false,
	);

	const setActiveGroup = refreshlessGroupNavigationEnabled
		? (newGroupId: number, newGroupName: string) => {
				_setActiveGroup(groupId, groupName, newGroupId, newGroupName);
			}
		: undefined;

	useEffect(() => {
		return watch(".group-button", refetchPendingGroups);
	}, []);

	const leaveGroup = (leaveGroupId: number) => {
		if (!authenticatedUser) return;

		const groupButton = document.body.querySelector<HTMLElement>(
			".group-button:not(#group-join-button)",
		);
		if (leaveGroupId === groupId.value && groupButton) {
			groupButton.click();
		} else {
			deleteUserGroupMembership({
				groupId: leaveGroupId,
				userId: authenticatedUser.userId,
			})
				.then(() => success(getMessage("group.pendingGroups.item.success")))
				.catch(() => warning(getMessage("group.pendingGroups.item.error")))
				.finally(refetchPendingGroups);
		}
	};

	return (
		<div className="pending-join-requests group-react-groups-list">
			<div className="groups-list-new">
				<div className="flex justify-between items-baseline">
					<h1 className="groups-list-heading">
						{getMessage("group.pendingGroups.title")}
					</h1>
					<a href={getSearchGroupsLink()} className="text-label-medium">
						{getMessage("group.pendingGroups.seeAll")}
					</a>
				</div>
				{pendingGroups?.length === 0 && (
					<div className="padding-y-medium">
						{getMessage("group.pendingGroups.noItems")}
					</div>
				)}
				<div className="groups-list-items-container">
					{pendingGroups?.length ? (
						<div>
							<div>
								<ul className="pending-groups-list">
									{pendingGroups.map((group) => (
										<li
											key={group.id}
											className={classNames("list-item", {
												active: groupId.value === group.id,
											})}
										>
											<GroupCard
												id={group.id}
												name={group.name}
												isLocked={group.isLocked}
												leaveGroup={() => leaveGroup(group.id)}
												setActiveGroup={setActiveGroup}
											/>
										</li>
									))}
								</ul>
							</div>
						</div>
					) : (
						pendingGroups === undefined && (
							<div className="menu-vertical">
								<Loading />
							</div>
						)
					)}
				</div>
			</div>
		</div>
	);
}

import { MultiBackend, Tree, getBackendOptions } from "@minoru/react-dnd-treeview";
import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import { DndProvider } from "react-dnd";
import {
	type AnyExpandedItem,
	type ExpandedFolderItem,
	type ExpandedGroupItem,
	GROUP_ORGANIZATION_STORAGE_KEY,
	type GroupOrganizationStorageValue,
} from "src/ts/constants/groupOrganization.ts";
import { addMessageListener } from "src/ts/helpers/communication/dom.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { asLocaleLowerCase, asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import {
	type GroupV1WithRole,
	getGroupsMetadata,
	listUserGroupsRoles,
	multigetGroupsPolicies,
} from "src/ts/helpers/requests/services/groups.ts";
import { setActiveGroup as _setActiveGroup } from "src/ts/utils/groups.ts";
import { getCreateGroupLink, getSearchGroupsLink } from "src/ts/utils/links.ts";
import { crossSort } from "src/ts/utils/objects.ts";
import Button from "../core/Button.tsx";
import Icon from "../core/Icon.tsx";
import Loading from "../core/Loading.tsx";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser.ts";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import usePromise from "../hooks/usePromise.ts";
import useStorage from "../hooks/useStorage.ts";
import GroupCard from "./Card.tsx";
import DNDGroupFolder from "./DNDFolder.tsx";
import { getFolderName } from "./utils/groupOrganization.ts";

export type DNDListProps = {
	activeGroupId: Signal<number>;
	activeGroupName: Signal<string>;
};

type DNDListLayout = {
	data: AnyExpandedItem[];
	hasGroups: boolean;
	hasPrimary: boolean;
};

export default function DNDList({ activeGroupId, activeGroupName }: DNDListProps) {
	const [searchQuery, setSearchQuery] = useState<string>();
	const [seamlessGroupNavigationEnabled] = useFeatureValue("groupSeamlessNavigation", false);

	const setActiveGroup = seamlessGroupNavigationEnabled
		? (groupId: number, groupName: string) => {
				return _setActiveGroup(activeGroupId, activeGroupName, groupId, groupName);
			}
		: undefined;

	const [authenticatedUser] = useAuthenticatedUser();

	const [joinedGroups, , , refetchJoinedGroups] = usePromise(
		() =>
			authenticatedUser &&
			listUserGroupsRoles({
				userId: authenticatedUser.userId,
				includeLocked: true,
			}).then(({ data }) =>
				multigetGroupsPolicies({
					groupIds: data.map((item) => item.group.id),
				}).then((policies) =>
					data.filter(
						(item) =>
							policies.groups.find((policy) => policy.groupId === item.group.id)
								?.canViewGroup,
					),
				),
			),
		[authenticatedUser?.userId],
		false,
	);

	const primaryGroup = useMemo(
		() => joinedGroups?.find((group) => group.isPrimaryGroup),
		[joinedGroups],
	);

	const [ownedGroups, unownedGroups] = useMemo(() => {
		if (!joinedGroups) return [];

		const items = joinedGroups.reduce<[GroupV1WithRole[], GroupV1WithRole[]]>(
			(previousValue, currentValue) => {
				if (
					currentValue.group.id !== primaryGroup?.group.id &&
					!currentValue.isPrimaryGroup
				) {
					if (currentValue.role.rank === 255) {
						previousValue[0].push(currentValue);
					} else {
						previousValue[1].push(currentValue);
					}
				}

				return previousValue;
			},
			[[], []],
		);

		return items.map((item) =>
			crossSort(item, (a, b) =>
				a.group.name < b.group.name ? -1 : a.group.name > b.group.name ? 0 : 1,
			),
		);
	}, [joinedGroups, primaryGroup]);

	const [storageValue, setStorageValue, , storageFetched] =
		useStorage<GroupOrganizationStorageValue>(GROUP_ORGANIZATION_STORAGE_KEY, {});

	const [layout, setLayout] = useState<DNDListLayout | undefined>();

	const updateLayout = (layout: DNDListLayout, shouldUpdateStorage = true) => {
		if (!authenticatedUser?.userId) {
			return;
		}

		setLayout(layout);

		if (shouldUpdateStorage) {
			const newLayoutData: GroupOrganizationStorageValue[number] = [];
			for (const item of layout.data) {
				if (item.parent) continue;

				if (item.type === "Group") {
					newLayoutData.push(item.group.id);
				} else {
					const folderItems: number[] = [];
					for (const item2 of layout.data) {
						if (item2.parent === item.dndId) {
							folderItems.push(item2.group.id);
						}
					}

					newLayoutData.push({
						groups: folderItems,
						id: item.id,
						name: item.name,
						color: item.color,
						open: item.open,
					});
				}
			}

			setStorageValue({
				...storageValue,
				[authenticatedUser.userId]: newLayoutData,
			});
		}
	};

	const shownDndIds = useMemo(() => {
		if (!layout || !searchQuery) return;

		const lowercaseSearchQuery = asLocaleLowerCase(searchQuery);
		const shownDndIds: string[] = [];
		for (const item of layout.data) {
			if (item.type === "Group") {
				if (asLocaleLowerCase(item.group.name).includes(lowercaseSearchQuery)) {
					shownDndIds.push(item.dndId);
				}
			} else {
				if (asLocaleLowerCase(item.name ?? "").includes(lowercaseSearchQuery)) {
					shownDndIds.push(item.dndId);
				}
			}
		}

		return shownDndIds;
	}, [searchQuery, layout]);

	useEffect(() => {
		if (!joinedGroups || !storageFetched || !authenticatedUser) return;

		if (layout?.hasPrimary && !layout?.hasGroups && !(ownedGroups && unownedGroups)) return;
		if (layout?.hasGroups && layout?.hasPrimary && !primaryGroup) return;

		const userStorage = storageValue?.[authenticatedUser.userId];
		if (userStorage) {
			const newGroups: AnyExpandedItem[] = [];
			for (const group of joinedGroups) {
				if (
					!userStorage.find((item) =>
						typeof item === "number"
							? item === group.group.id
							: item.groups.includes(group.group.id),
					)
				) {
					newGroups.push({
						...group,
						type: "Group",
						dndId: `group-${group.group.id}`,
						parent: 0,
					});
				}
			}

			const newStorage: AnyExpandedItem[] = [];
			for (const item of userStorage) {
				if (typeof item === "number") {
					const group = joinedGroups.find((group) => item === group.group.id);
					if (!group) continue;
					newStorage.push({
						...group,
						type: "Group",
						dndId: `group-${item}`,
						parent: 0,
					});

					continue;
				}

				const groups: ExpandedGroupItem[] = [];
				for (const group of item.groups) {
					const groupItem = joinedGroups.find((group2) => group === group2.group.id);
					if (!groupItem) continue;

					groups.push({
						...groupItem,
						type: "Group",
						dndId: `group-${groupItem.group.id}`,
						parent: `folder-${item.id}`,
					});
				}

				if (groups.length === 0) continue;

				newStorage.push({
					...item,
					type: "Folder",
					dndId: `folder-${item.id}`,
					parent: 0,
				});
				newStorage.push(...groups);
			}

			newStorage.push(...newGroups);

			return updateLayout(
				{
					data: newStorage,
					hasGroups: true,
					hasPrimary: !!primaryGroup,
				},
				false,
			);
		}

		const data: ExpandedGroupItem[] = [];
		for (const group of [primaryGroup, ...unownedGroups, ...ownedGroups]) {
			if (group) {
				data.push({
					type: "Group",
					dndId: `group-${group.group.id}`,
					parent: 0,
					...group,
				});
			}
		}

		updateLayout(
			{
				data,
				hasGroups: true,
				hasPrimary: !!primaryGroup,
			},
			false,
		);
	}, [ownedGroups, unownedGroups, primaryGroup?.group.id, authenticatedUser?.userId]);

	const layoutTree = useMemo(() => {
		return layout?.data.map((item) => ({
			parent: item.parent,
			text: `${item.type.toLowerCase()} ${
				item.type === "Folder"
					? getFolderName(item.name, item.dndId, layout.data)
					: item.group.name
			}`,
			id: item.dndId,
			data: item,
		}));
	}, [layout?.data]);

	const initialOpenDndIds = useMemo(() => {
		const initialOpenDndIds: string[] = [];
		if (layout?.data) {
			for (const item of layout.data) {
				if (item.type === "Folder" && item.open) {
					initialOpenDndIds.push(item.dndId);
				}
			}
		}
		return initialOpenDndIds;
	}, [layout?.data]);

	const [groupsLimit] = usePromise(
		() => authenticatedUser && getGroupsMetadata().then((data) => data.groupLimit),
		[authenticatedUser?.userId],
	);

	const transformIntoItem = (
		item: AnyExpandedItem,
		isDragging: boolean,
		isDropTarget: boolean,
		isOpen?: boolean,
		toggleOpen?: () => void,
	) => {
		if (!layout) {
			return <></>;
		}

		const update = (data: Partial<ExpandedFolderItem>) =>
			updateLayout({
				...layout,
				// @ts-expect-error: Fine, just partial stuff
				data: layout!.data.map((item2) =>
					item2.dndId === item.dndId
						? {
								...item2,
								...data,
							}
						: item2,
				),
			});

		const groups: ExpandedGroupItem[] = [];
		for (const item2 of layout.data) {
			if (item2.type === "Group" && item2.parent === item.dndId) {
				groups.push(item2);
			}
		}

		return (
			<div
				className={classNames("list-item", {
					active:
						!isDragging && item.type === "Group"
							? activeGroupId.value === item.group.id
							: !isOpen &&
								groups.some((item) => activeGroupId.value === item.group.id),
					"is-dragging": isDragging,
					"is-hidden":
						shownDndIds &&
						!shownDndIds?.includes(item.dndId) &&
						!groups.some((group) => shownDndIds?.includes(group.dndId)),
					"is-drop-target": isDropTarget,
				})}
			>
				{item.type === "Folder" ? (
					<DNDGroupFolder
						name={item.name}
						color={item.color}
						groups={groups}
						isOpen={isOpen}
						toggleOpen={
							toggleOpen
								? () => {
										toggleOpen();
										update({
											open: !isOpen,
										});
									}
								: undefined
						}
						updateFolder={update}
						dndId={item.dndId}
					/>
				) : (
					<GroupCard
						className="group-item-container"
						id={item.group.id}
						name={item.group.name}
						isLocked={item.group.isLocked}
						isOwned={item.role.rank === 255}
						memberCount={item.group.memberCount}
						setActiveGroup={setActiveGroup}
					/>
				)}
			</div>
		);
	};

	useEffect(() => {
		return addMessageListener("group.list.update", refetchJoinedGroups);
	}, []);

	if (!authenticatedUser) {
		return null;
	}

	return (
		<div className="dnd-groups-list-container group-react-groups-list">
			<div className="groups-list-new">
				<div className="flex justify-between items-baseline">
					<h1 className="groups-list-heading">{getMessage("group.list.title")}</h1>
					<a className="text-label-medium" href={getSearchGroupsLink()}>
						{getMessage("group.list.seeAll")}
					</a>
				</div>
				{joinedGroups && layout ? (
					<>
						<div className="groups-list-search">
							<Icon name="common-search" size="sm" />
							<input
								className="groups-list-search-input"
								placeholder={getMessage("group.list.searchMyGroups")}
								onChange={(e) => {
									setSearchQuery(
										(e.target as HTMLInputElement)?.value || undefined,
									);
								}}
								autocomplete="off"
								data-1p-ignore
								data-lpignore="true"
								data-protonpass-ignore="true"
							/>
						</div>
						{shownDndIds?.length === 0 && (
							<div className="padding-y-medium">
								{getMessage("group.list.noItems")}
							</div>
						)}
						<div className="groups-list-items-container">
							{(!searchQuery || (shownDndIds && shownDndIds.length > 0)) && (
								<div>
									<div>
										<DndProvider
											backend={MultiBackend}
											options={getBackendOptions()}
										>
											<Tree
												classes={{
													placeholder: "drop-placeholder",
													root: "dnd-groups-list",
													container: "folder-groups-container",
													listItem: "dnd-item",
												}}
												sort={false}
												tree={layoutTree!}
												rootId={0}
												render={(
													node,
													{ isOpen, onToggle, isDragging, isDropTarget },
												) =>
													transformIntoItem(
														node.data!,
														isDragging,
														isDropTarget,
														isOpen,
														onToggle,
													)
												}
												onDrop={(data) => {
													const items: AnyExpandedItem[] = [];
													for (const item of data) {
														const itemData = item.data!;
														const parentId =
															item.parent ?? itemData.parent;

														// @ts-expect-error: Fine
														const newItemData: AnyExpandedItem = {
															...itemData,
															parent: parentId,
														};

														if (itemData.type === "Folder") {
															items.push(newItemData);
															continue;
														}

														const itemItems: AnyExpandedItem[] = [];
														let parent: AnyExpandedItem | undefined;
														for (const item of data) {
															if (item.parent === newItemData.dndId) {
																itemItems.push(item.data!);
															}

															if (item.id === newItemData.parent) {
																parent = item.data!;
															}
														}

														if (parent?.type === "Group") {
															continue;
														}

														if (itemItems.length >= 1) {
															const id = crypto.randomUUID();
															items.push(
																{
																	type: "Folder",
																	id,
																	dndId: `folder-${id}`,
																	parent: 0,
																},
																{
																	...itemData,
																	parent: `folder-${id}`,
																},
															);

															for (const item of itemItems) {
																// @ts-expect-error: Fine
																items.push({
																	...item,
																	parent: `folder-${id}`,
																});
															}

															continue;
														}

														items.push(newItemData);
													}

													updateLayout({
														...layout,
														data: items.filter(
															(item, index, arr) =>
																(item.type === "Group" &&
																	arr.findIndex(
																		(item2) =>
																			item.dndId ===
																			item2.dndId,
																	) === index) ||
																arr.some(
																	(item2) =>
																		item2.parent === item.dndId,
																),
														),
													});
												}}
												canDrop={(_, { dragSource, dropTarget }) => {
													if (!dragSource || !dropTarget) {
														return true;
													}

													return (
														dragSource.data?.type !== "Folder" &&
														!dropTarget.parent &&
														dropTarget.id !== dragSource.id
													);
												}}
												initialOpen={initialOpenDndIds}
												placeholderRender={() => (
													<div className="drop-placeholder-item" />
												)}
											/>
										</DndProvider>
									</div>
								</div>
							)}
						</div>
					</>
				) : (
					joinedGroups?.length === undefined && (
						<div className="menu-vertical">
							<Loading />
						</div>
					)
				)}
				<div className="groups-list-buttons-bottom">
					<Button
						as="a"
						href={getCreateGroupLink()}
						width="full"
						type="control"
						className="groups-list-create-button"
						disabled={
							!joinedGroups || !groupsLimit || joinedGroups?.length >= groupsLimit
						}
					>
						{getMessage("group.list.createGroup")}
					</Button>
					{!!joinedGroups && !!groupsLimit && joinedGroups.length >= groupsLimit && (
						<span className="small text create-group-text">
							{getMessage("group.list.maxGroupsReached", {
								maxGroups: asLocaleString(groupsLimit),
							})}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

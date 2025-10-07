import MdOutlineInfoIcon from "@material-symbols/svg-400/outlined/info.svg";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	profileProcessor,
	type UserProfileResponse,
} from "src/ts/helpers/processors/profileProcessor";
import {
	type BadgeAwardedDate,
	type BadgeDetails,
	listUniverseBadges,
	multigetBadgesAwardedDates,
} from "src/ts/helpers/requests/services/badges";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { crossSort } from "src/ts/utils/objects";
import Button from "../../core/Button";
import CheckboxField from "../../core/CheckboxField";
import Icon from "../../core/Icon";
import AgentMentionContainer from "../../core/items/AgentMentionContainer";
import Loading from "../../core/Loading";
import Tooltip from "../../core/Tooltip";
import UserLookup from "../../core/UserLookup";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import BadgesGrid from "./Grid";
import BadgesList from "./List";
import FiltersContainer from "../../core/filters/FiltersContainer";

export type Filters = {
	showActive: boolean;
	showInactive: boolean;
	showObtained: boolean;
	showUnobtained: boolean;

	showAllBadgesInProgress: boolean;
};

const SORT_OBTAINED_TYPES = ["First", "Last", "Default"] as const;
const SORT_BY_TYPES = [
	"WonYesterday",
	"WonAllTime",
	"AwardedTime",
	"Created",
	"Name",
	"Rank",
] as const;
const SORT_DIRECTION_TYPES = ["Ascending", "Descending"] as const;

export type Sorts = {
	sortObtained: (typeof SORT_OBTAINED_TYPES)[number];
	sortBy: (typeof SORT_BY_TYPES)[number];
	sortDirection: (typeof SORT_DIRECTION_TYPES)[number];
};

export type BadgeComparisonUserProps = {
	user?: UserProfileResponse | void;
	awardedDates?: BadgeAwardedDate[] | null;
	setUser: (user?: UserProfileResponse) => void;
	progress: number;
	progressPercentage: number;
	totalBadges: number;
	isRight?: boolean;
};

function BadgeComparisonUser({
	user,
	awardedDates,
	setUser,
	totalBadges,
	progress,
	progressPercentage,
	isRight,
}: BadgeComparisonUserProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [badgeProgressEnabled] = useFeatureValue(
		"improvedExperienceBadges.showBadgeProgress",
		false,
	);

	return (
		<div className="users-progress-container">
			<div
				className={classNames("user-progress-container", {
					"bottom-gap": user,
				})}
			>
				{badgeProgressEnabled && (
					<div
						className={classNames("progress-bar-container", {
							"roseal-disabled": !awardedDates,
						})}
					>
						<CircularProgressbarWithChildren
							className="progress-bar"
							value={progressPercentage * 100}
						>
							<span className="progress-percentage">
								{asLocaleString(progressPercentage, {
									style: "percent",
								})}
							</span>
							<span className="progress-percentage-progress text">
								<span>
									{getMessage("experience.badges.userProgress.completed")}
								</span>
								{totalBadges !== 0 && user && (
									<span className="progress-total-label">
										{getMessage("experience.badges.userProgress.totalLabel", {
											progress: asLocaleString(progress),
											totalBadges: asLocaleString(totalBadges),
										})}
									</span>
								)}
							</span>
						</CircularProgressbarWithChildren>
					</div>
				)}
				<div className="user-details-container">
					{user ? (
						<>
							<AgentMentionContainer
								targetType="User"
								targetId={user.userId}
								name={user.names.combinedName}
								hasVerifiedBadge={user.isVerified}
							/>
							<button
								type="button"
								className="roseal-btn remove-item-btn"
								onClick={() => {
									setUser(
										!isRight &&
											authenticatedUser &&
											authenticatedUser.userId !== user?.userId
											? {
													userId: authenticatedUser.userId,
													names: {
														displayName: authenticatedUser.displayName,
														username: authenticatedUser.username,
														combinedName: authenticatedUser.displayName,
													},
													isVerified: authenticatedUser.hasVerifiedBadge,
													isDeleted: false,
												}
											: undefined,
									);
								}}
							>
								<Icon name="close" size="16x16" />
							</button>
						</>
					) : (
						<UserLookup
							className={classNames({
								"user-lookup-right": isRight,
							})}
							updateUser={(user) =>
								setUser({
									userId: user.id,
									names: {
										displayName: user.displayName,
										username: user.name,
										combinedName: user.displayName,
									},
									isVerified: user.hasVerifiedBadge,
									isDeleted: false,
								})
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

export type BadgesTabContentProps = {
	universeId: number;
};

export default function BadgesTabContent({ universeId }: BadgesTabContentProps) {
	const [authenticatedUser] = useAuthenticatedUser();

	const [filtersSortsEnabled] = useFeatureValue(
		"improvedExperienceBadges.showFiltersSorts",
		false,
	);
	const [gridUIEnabled] = useFeatureValue("improvedExperienceBadges.showGridUI", false);
	const [badgeProgressEnabled] = useFeatureValue(
		"improvedExperienceBadges.showBadgeProgress",
		false,
	);

	const [filters, setFilters] = useState<Filters>({
		showActive: true,
		showInactive: false,
		showObtained: true,
		showUnobtained: true,
		showAllBadgesInProgress: false,
	});
	const [sorts, setSorts] = useState<Sorts>({
		sortObtained: "Default",
		sortBy: "Rank",
		sortDirection: "Descending",
	});

	const [[user1, user2], setUsers] = useState<
		[UserProfileResponse | undefined | void, UserProfileResponse | undefined | void]
	>([undefined, undefined]);
	const [user1AwardedDates, setUser1AwardedDates] = useState<
		BadgeAwardedDate[] | undefined | null
	>(undefined);
	const [user2AwardedDates, setUser2AwardedDates] = useState<
		BadgeAwardedDate[] | undefined | null
	>(undefined);

	const [parsingHash, setParsingHash] = useState(false);

	const { items, allItems, loading, error } = usePages<BadgeDetails, string>({
		paging: {
			method: "fullList",
		},
		getNextPage: (state) =>
			listUniverseBadges({
				universeId,
				limit: 100,
				sortBy: "Rank",
				cursor: state.nextCursor,
			}).then((data) => ({
				...state,
				items: data.data,
				nextCursor: data.nextPageCursor,
				hasNextPage: !!data.nextPageCursor,
			})),
		items: {
			filterItem: (item) => {
				if (filtersSortsEnabled) {
					const obtained =
						user1AwardedDates?.some((date) => date.badgeId === item.id) ||
						user2AwardedDates?.some((date) => date.badgeId === item.id);

					return (
						(item.enabled ? filters.showActive : filters.showInactive) &&
						(obtained ? filters.showObtained : filters.showUnobtained)
					);
				}

				return item.enabled;
			},
			sortItems: filtersSortsEnabled
				? (items) => {
						const results = crossSort([...items], (a, b) => {
							let aCompare: string | number | Date | undefined;
							let bCompare: string | number | Date | undefined;

							let aAwarded1: Date | undefined;
							let bAwarded1: Date | undefined;
							let aAwarded2: Date | undefined;
							let bAwarded2: Date | undefined;

							for (const item of user1AwardedDates ?? []) {
								if (item.badgeId === a.id) {
									aAwarded1 = new Date(item.awardedDate);
								}
								if (item.badgeId === b.id) {
									bAwarded1 = new Date(item.awardedDate);
								}
							}

							for (const item of user2AwardedDates ?? []) {
								if (item.badgeId === a.id) {
									aAwarded2 = new Date(item.awardedDate);
								}
								if (item.badgeId === b.id) {
									bAwarded2 = new Date(item.awardedDate);
								}
							}

							switch (sorts.sortBy) {
								case "WonYesterday": {
									aCompare = a.statistics.winRatePercentage;
									bCompare = b.statistics.winRatePercentage;

									break;
								}
								case "AwardedTime": {
									if (aAwarded1) {
										if (!aAwarded2) {
											aCompare = aAwarded1;
										} else {
											if (aAwarded1 > aAwarded2) {
												aCompare = aAwarded2;
											} else aCompare = aAwarded1;
										}
									} else if (aAwarded2) aCompare = aAwarded2;

									if (bAwarded1) {
										if (!bAwarded2) {
											bCompare = bAwarded1;
										} else {
											if (bAwarded1 > bAwarded2) {
												bCompare = bAwarded2;
											} else bCompare = bAwarded1;
										}
									} else if (bAwarded2) bCompare = bAwarded2;

									break;
								}

								case "Created": {
									const tempACompare = a.created;
									if (tempACompare) aCompare = new Date(tempACompare);
									const tempBCompare = b.created;
									if (tempBCompare) bCompare = new Date(tempBCompare);

									break;
								}

								case "Name": {
									aCompare = a.name;
									bCompare = b.name;

									break;
								}

								case "WonAllTime": {
									aCompare = a.statistics.awardedCount;
									bCompare = b.statistics.awardedCount;

									break;
								}
							}

							if (!aCompare && bCompare) return 1;
							if (aCompare && !bCompare) return -1;

							if (!aCompare && !bCompare) return 0;

							return aCompare! < bCompare! ? 1 : aCompare! > bCompare! ? -1 : 0;
						});

						if (sorts.sortDirection === "Ascending") {
							results.reverse();
						}

						if (sorts.sortObtained !== "Default") {
							crossSort(results, (a, b) => {
								let aObtained = false;
								let bObtained = false;
								for (const item of user1AwardedDates ?? []) {
									if (item.badgeId === a.id) {
										aObtained = true;
									}
									if (item.badgeId === b.id) {
										bObtained = true;
									}
								}

								for (const item of user2AwardedDates ?? []) {
									if (item.badgeId === a.id) {
										aObtained = true;
									}
									if (item.badgeId === b.id) {
										bObtained = true;
									}
								}

								return aObtained === bObtained
									? 0
									: aObtained
										? sorts.sortObtained === "First"
											? -1
											: 1
										: sorts.sortObtained === "First"
											? 1
											: -1;
							});
						}

						return results;
					}
				: undefined,
		},
		dependencies: {
			refreshPage: [filtersSortsEnabled, filters, sorts, user1AwardedDates],
			reset: [universeId],
		},
	});

	const allIds: number[] = [];
	for (const item of allItems) {
		allIds.push(item.id);
	}

	const recountUser1AwardedDates = useCallback(
		(recount: boolean) => {
			if (!allIds.length) {
				return;
			}

			setUser1AwardedDates(undefined);
			if (user1) {
				multigetBadgesAwardedDates({
					userId: user1.userId,
					badgeIds: allIds,
					overrideCache: recount,
				})
					.then(setUser1AwardedDates)
					.catch(() => setUser1AwardedDates(null));
			}
		},
		[allItems, user1?.userId],
	);

	const recountUser2AwardedDates = useCallback(
		(recount: boolean) => {
			if (!allIds.length) {
				return;
			}

			setUser2AwardedDates(undefined);
			if (user2) {
				multigetBadgesAwardedDates({
					userId: user2.userId,
					badgeIds: allIds,
					overrideCache: recount,
				})
					.then(setUser2AwardedDates)
					.catch(() => setUser2AwardedDates(null));
			}
		},
		[allItems, user2?.userId],
	);

	useEffect(() => {
		recountUser1AwardedDates(false);
	}, [allItems, recountUser1AwardedDates]);

	useEffect(() => {
		recountUser2AwardedDates(false);
	}, [allItems, recountUser2AwardedDates]);

	const [user1Progress, user2Progress, totalBadges, hasMaybeUnobtainableBadges] = useMemo(() => {
		let user1Progress = 0;
		let user2Progress = 0;
		let totalBadges = 0;
		let hasMaybeUnobtainableBadges = false;

		for (const badge of items) {
			const isMaybeObtainable = badge.enabled && badge.statistics.pastDayAwardedCount > 0;

			if (!isMaybeObtainable) {
				hasMaybeUnobtainableBadges = true;
			}

			if (isMaybeObtainable || filters.showAllBadgesInProgress) {
				totalBadges++;

				if (user1AwardedDates) {
					for (const item of user1AwardedDates) {
						if (item.badgeId === badge.id) {
							user1Progress++;
							break;
						}
					}
				}

				if (user2AwardedDates) {
					for (const item of user2AwardedDates) {
						if (item.badgeId === badge.id) {
							user2Progress++;
							break;
						}
					}
				}
			}
		}

		const user1ProgressPercentage = totalBadges === 0 ? 1 : user1Progress / totalBadges;
		const user2ProgressPercentage = totalBadges === 0 ? 1 : user2Progress / totalBadges;

		return [
			{
				progress: user1Progress,
				progressPercentage: user1ProgressPercentage,
			},
			{
				progress: user2Progress,
				progressPercentage: user2ProgressPercentage,
			},
			totalBadges,
			hasMaybeUnobtainableBadges,
		];
	}, [items, user1AwardedDates, user2AwardedDates, filters.showAllBadgesInProgress]);

	const showActiveFilter = useMemo(() => {
		for (const item of allItems) {
			if (!item.enabled) {
				return true;
			}
		}

		return false;
	}, [allItems]);

	useEffect(() => {
		if (!authenticatedUser || user1) {
			return;
		}

		setUsers([
			{
				userId: authenticatedUser.userId,
				names: {
					displayName: authenticatedUser.displayName,
					username: authenticatedUser.username,
					combinedName: authenticatedUser.displayName,
				},
				isVerified: authenticatedUser.hasVerifiedBadge,
				isDeleted: false,
			},
			undefined,
		]);
	}, [authenticatedUser?.userId]);

	useEffect(() => {
		const parseHash = () => {
			if (!location.hash.startsWith("#!/badges")) return;

			setParsingHash(true);
			const [userId1String, userId2String] = location.hash.split("/").splice(2, 2);

			const userId1 = Number.parseInt(userId1String, 10) || undefined;
			const userId2 = Number.parseInt(userId2String, 10) || undefined;

			getAuthenticatedUser().then((authenticatedUser) => {
				const authedUser = authenticatedUser && {
					userId: authenticatedUser.userId,
					names: {
						displayName: authenticatedUser.displayName,
						username: authenticatedUser.username,
						combinedName: authenticatedUser.displayName,
					},
					isVerified: authenticatedUser.hasVerifiedBadge,
					isDeleted: false,
				};

				Promise.all([
					userId1 && user1?.userId !== userId1
						? profileProcessor
								.request({
									userId: userId1,
								})
								.catch(() => authedUser)
						: (user1 ?? authedUser),

					userId2
						? user2?.userId !== userId2
							? profileProcessor
									.request({
										userId: userId2,
									})
									.catch(() => {})
							: user2
						: undefined,
				]).then((users) => {
					setUsers(users);
					setParsingHash(false);
				});
			});
		};

		parseHash();

		globalThis.addEventListener("hashchange", parseHash);
		return () => {
			globalThis.removeEventListener("hashchange", parseHash);
		};
	}, []);

	useEffect(() => {
		if (!user1 || parsingHash) return;

		location.hash = `#!/badges${
			(authenticatedUser && user1 && authenticatedUser?.userId !== user1?.userId) || user2
				? `/${user1?.userId}${user2 ? `/${user2?.userId}` : ""}`
				: ""
		}`;
	}, [user1?.userId, user2?.userId, parsingHash]);

	const isComparison = user2 !== undefined && user1 !== undefined;

	const recountBadgesBtn = (
		<div className="recount-badges-btn-container">
			<Button
				type="secondary"
				className="recount-badges-btn"
				disabled={!user2AwardedDates && !user1AwardedDates}
				onClick={() => {
					recountUser1AwardedDates(true);
					recountUser2AwardedDates(true);
				}}
			>
				{getMessage("experience.badges.userProgress.recount")}
			</Button>
		</div>
	);

	return (
		<div className="roseal-badges-container">
			{allItems && allItems.length !== 0 && items ? (
				<div
					className={classNames("roseal-badges", {
						"roseal-disabled":
							(user1 && user1AwardedDates === undefined) ||
							(user2 && user2AwardedDates === undefined),
					})}
				>
					{filtersSortsEnabled && (
						<div className="badges-filters store-item-filters">
							<FiltersContainer
								filters={[
									{
										id: "obtainedStatus",
										type: "checkbox",
										options: [
											{
												label: getMessage(
													"experience.badges.filtering.obtainedStatus.values.obtained",
												),
												value: true,
											},
											{
												label: getMessage(
													"experience.badges.filtering.obtainedStatus.values.unobtained",
												),
												value: false,
											},
										],
										previewTitle: filters.showObtained
											? filters.showUnobtained
												? getMessage(
														"experience.badges.filtering.obtainedStatus.previewLabel.all",
													)
												: getMessage(
														"experience.badges.filtering.obtainedStatus.values.obtained",
													)
											: filters.showUnobtained
												? getMessage(
														"experience.badges.filtering.obtainedStatus.values.unobtained",
													)
												: getMessage(
														"experience.badges.filtering.obtainedStatus.previewLabel.none",
													),
										title: getMessage(
											"experience.badges.filtering.obtainedStatus.label",
										),
										defaultValue: [true, false],
										value: filters.showObtained
											? filters.showUnobtained
												? [true, false]
												: [true]
											: filters.showUnobtained
												? [false]
												: [],
									},
									{
										id: "activeStatus",
										type: "checkbox",
										options: [
											{
												label: getMessage(
													"experience.badges.filtering.activeStatus.values.active",
												),
												value: true,
											},
											{
												label: getMessage(
													"experience.badges.filtering.activeStatus.values.inactive",
												),
												value: false,
											},
										],
										previewTitle: filters.showActive
											? filters.showInactive
												? getMessage(
														"experience.badges.filtering.activeStatus.previewLabel.all",
													)
												: getMessage(
														"experience.badges.filtering.activeStatus.values.active",
													)
											: filters.showInactive
												? getMessage(
														"experience.badges.filtering.activeStatus.values.inactive",
													)
												: getMessage(
														"experience.badges.filtering.activeStatus.previewLabel.none",
													),
										title: getMessage(
											"experience.badges.filtering.activeStatus.label",
										),
										defaultValue: [true],
										value: filters.showActive
											? filters.showInactive
												? [true, false]
												: [true]
											: filters.showInactive
												? [false]
												: [],
										visible: showActiveFilter,
									},
									{
										id: "sortBy",
										type: "dropdown",
										options: SORT_BY_TYPES.map((option) => ({
											label: getMessage(
												`experience.badges.filtering.sortBy.values.${option}`,
											),
											value: option,
										})),
										previewTitle: getMessage(
											"experience.badges.filtering.sortBy.previewLabel",
											{
												label: getMessage(
													`experience.badges.filtering.sortBy.values.${sorts.sortBy}`,
												),
											},
										),
										title: getMessage(
											"experience.badges.filtering.sortBy.label",
										),
										defaultValue: "Rank",
										value: sorts.sortBy,
									},
									{
										id: "sortDirection",
										type: "dropdown",
										options: SORT_DIRECTION_TYPES.map((option) => ({
											label: getMessage(
												`experience.badges.filtering.sortDirection.values.${option}`,
											),
											value: option,
										})),
										previewTitle: getMessage(
											"experience.badges.filtering.sortDirection.previewLabel",
											{
												label: getMessage(
													`experience.badges.filtering.sortDirection.values.${sorts.sortDirection}`,
												),
											},
										),
										title: getMessage(
											"experience.badges.filtering.sortDirection.label",
										),
										defaultValue: "Descending",
										value: sorts.sortDirection,
									},
									{
										id: "sortObtained",
										type: "dropdown",
										options: SORT_OBTAINED_TYPES.map((option) => ({
											label: getMessage(
												`experience.badges.filtering.sortObtained.values.${option}`,
											),
											value: option,
										})),
										previewTitle: getMessage(
											"experience.badges.filtering.sortObtained.previewLabel",
											{
												label: getMessage(
													`experience.badges.filtering.sortObtained.values.${sorts.sortObtained}`,
												),
											},
										),
										title: getMessage(
											"experience.badges.filtering.sortObtained.label",
										),
										defaultValue: "Default",
										value: sorts.sortObtained,
									},
								]}
								applyFilterValue={(key, value) => {
									if (key === "obtainedStatus") {
										setFilters({
											...filters,
											showObtained: (value as boolean[]).includes(true),
											showUnobtained: (value as boolean[]).includes(false),
										});
									} else if (key === "activeStatus") {
										setFilters({
											...filters,
											showActive: (value as boolean[]).includes(true),
											showInactive: (value as boolean[]).includes(false),
										});
									} else if (key === "sortBy") {
										setSorts({
											...sorts,
											sortBy: value as (typeof SORT_BY_TYPES)[number],
										});
									} else if (key === "sortDirection") {
										setSorts({
											...sorts,
											sortDirection:
												value as (typeof SORT_DIRECTION_TYPES)[number],
										});
									} else if (key === "sortObtained") {
										setSorts({
											...sorts,
											sortObtained:
												value as (typeof SORT_OBTAINED_TYPES)[number],
										});
									}
								}}
							/>

							{!badgeProgressEnabled && recountBadgesBtn}
							{badgeProgressEnabled && hasMaybeUnobtainableBadges && (
								<div className="badge-filter badge-sorts store-item-filter">
									<div className="filter-title">
										<span className="font-bold">
											{getMessage(
												"experience.badges.filtering.countAllBadgesProgress.label",
											)}
										</span>
										<Tooltip
											button={<MdOutlineInfoIcon className="roseal-icon" />}
										>
											{getMessage(
												"experience.badges.filtering.countAllBadgesProgress.tooltip",
											)}
										</Tooltip>
									</div>
									<div className="filters-list">
										<CheckboxField
											className="show-all-checkbox"
											disabled={loading}
											checked={filters.showAllBadgesInProgress}
											onChange={(value) => {
												setFilters({
													...filters,
													showAllBadgesInProgress: value,
												});
											}}
										>
											<label className="checkbox-label text-label" />
										</CheckboxField>
									</div>
								</div>
							)}
						</div>
					)}
					{items ? (
						items.length === 0 ? (
							<div className="section-content-off">
								{getMessage("experience.badges.noFilteredItems")}
							</div>
						) : (
							<>
								<div className="users-progress-container">
									<BadgeComparisonUser
										user={user1}
										setUser={(user) => setUsers([user, user2])}
										awardedDates={user1AwardedDates}
										totalBadges={totalBadges}
										progress={user1Progress.progress}
										progressPercentage={user1Progress.progressPercentage}
									/>
									{badgeProgressEnabled && recountBadgesBtn}
									<BadgeComparisonUser
										user={user2}
										setUser={(user) => setUsers([user1, user])}
										awardedDates={user2AwardedDates}
										totalBadges={totalBadges}
										progress={user2Progress.progress}
										progressPercentage={user2Progress.progressPercentage}
										isRight
									/>
								</div>
								{gridUIEnabled ? (
									<BadgesGrid
										items={items}
										isComparison={isComparison}
										user1={user1AwardedDates ?? undefined}
										user1Username={user1?.names.username}
										user2={user2AwardedDates ?? undefined}
										user1Id={user1?.userId}
										user2Id={user2?.userId}
									/>
								) : (
									<BadgesList
										items={items}
										isComparison={isComparison}
										user1={user1AwardedDates ?? undefined}
										user1Username={user1?.names.username}
										user2={user2AwardedDates ?? undefined}
										user1Id={user1?.userId}
										user2Id={user2?.userId}
									/>
								)}
							</>
						)
					) : user1AwardedDates === null || user2AwardedDates === null ? (
						<div className="section-content-off">
							{getMessage("experience.badges.errors.awarded")}
						</div>
					) : (
						<Loading />
					)}
				</div>
			) : loading ? (
				<Loading />
			) : (
				<div className="section-content-off">
					{getMessage(
						error ? "experience.badges.errors.generic" : "experience.badges.noItems",
					)}
				</div>
			)}
		</div>
	);
}

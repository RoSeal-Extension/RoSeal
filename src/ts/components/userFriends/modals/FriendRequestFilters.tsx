import MdOutlineFilterAltFilled from "@material-symbols/svg-400/outlined/filter_alt-fill.svg";
import classNames from "classnames";
import type { RefObject } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { MAX_COMMUNITIES_LIMIT, MAX_CONNECTIONS_LIMIT } from "src/ts/constants/friends";
import { ROBLOX_BADGES_CONFIG } from "src/ts/constants/profile";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import Dropdown from "../../core/Dropdown";
import Icon from "../../core/Icon";
import Popover from "../../core/Popover";
import TextInput from "../../core/TextInput";
import VerifiedBadge from "../../icons/VerifiedBadge";
import type { FriendRequestsFilters } from "../tabs/FriendRequestsTab";
import { formatDateForInput } from "../utils/filters";

export type FriendRequestFiltersProps = {
	filters: FriendRequestsFilters;
	disabled?: boolean;
	setFilters: (value: FriendRequestsFilters) => void;
	container: RefObject<HTMLDivElement>;
};

export default function FriendRequestFilters({
	filters,
	disabled,
	setFilters,
	container,
}: FriendRequestFiltersProps) {
	const [previewFilters, setPreviewFilters] = useState({
		...filters,
	});

	const premiumVerifiedBadgeOptions = useMemo(
		() => [
			{
				id: "true",
				value: true,
				label: getMessage("friends.filters.badges.premiumVerified.options.true"),
			},
			{
				id: "false",
				value: false,
				label: getMessage("friends.filters.badges.premiumVerified.options.false"),
			},
			{
				id: "disabled",
				value: undefined,
				label: getMessage("friends.filters.badges.premiumVerified.options.disabled"),
			},
		],
		[],
	);

	const [minJoinedDateValue, maxJoinedDateValue, currentData] = useMemo(() => {
		const minDate = previewFilters.minJoinedDate
			? new Date(previewFilters.minJoinedDate * 1_000)
			: undefined;
		const maxDate = previewFilters.maxJoinedDate
			? new Date(previewFilters.maxJoinedDate * 1_000)
			: undefined;
		const current = new Date();

		return [
			minDate && formatDateForInput(minDate),
			maxDate && formatDateForInput(maxDate),
			formatDateForInput(current),
		];
	}, [previewFilters.minJoinedDate, previewFilters.maxJoinedDate]);

	useEffect(() => {
		setPreviewFilters({
			...filters,
		});
	}, [filters]);

	return (
		<Popover
			trigger="click"
			placement="auto"
			container={container}
			className="friend-request-filters-popover-container"
			button={
				<button
					type="button"
					className={classNames("btn-generic-more-sm advanced-filtering-btn", {
						disabled,
					})}
				>
					<div className="filter-icon-container">
						<MdOutlineFilterAltFilled className="roseal-icon" />
					</div>
					<div className="filter-text-container">
						{getMessage("friends.filters.buttonText")}
					</div>
				</button>
			}
		>
			<div className="friend-request-filters-popover">
				<div className="request-filters-container">
					<div className="filters-section">
						<div>
							<h3>{getMessage("friends.filters.badges.title")}</h3>
						</div>
						<div className="filters-list">
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.badges.premiumVerified.title")}
								</h5>
								<ul className="filter-options multi-item-options one-row">
									<li className="multi-item-option has-dropdown">
										<div className="filter-option-icon-container">
											<Icon
												name="premium"
												size="medium"
												className="premium-zoom"
											/>
										</div>
										<div className="filter-option-dropdown-container">
											<Dropdown
												selectionItems={premiumVerifiedBadgeOptions}
												selectedItemValue={previewFilters.isPremium}
												onSelect={(isPremium) => {
													setPreviewFilters({
														...previewFilters,
														isPremium,
													});
												}}
											/>
										</div>
									</li>
									<li className="multi-item-option has-dropdown">
										<div className="filter-option-icon-container">
											<VerifiedBadge height={35} width={35} />
										</div>
										<div className="filter-option-dropdown-container">
											<Dropdown
												selectionItems={premiumVerifiedBadgeOptions}
												selectedItemValue={previewFilters.isVerified}
												onSelect={(isVerified) => {
													setPreviewFilters({
														...previewFilters,
														isVerified,
													});
												}}
											/>
										</div>
									</li>
								</ul>
							</div>
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.badges.robloxBadges.title")}
								</h5>
								<ul className="filter-options multi-item-options">
									{ROBLOX_BADGES_CONFIG.map((badge) => {
										if (badge.deprecated) return null;

										const isIncluded = useMemo(
											() => previewFilters.robloxBadgeIds?.includes(badge.id),
											[previewFilters.robloxBadgeIds],
										);

										const onClick = useCallback(() => {
											if (!isIncluded) {
												setPreviewFilters({
													...previewFilters,
													robloxBadgeIds: [
														...(previewFilters.robloxBadgeIds ?? []),
														badge.id,
													],
												});
											} else {
												const excluded =
													previewFilters.robloxBadgeIds!.filter(
														(item) => item !== badge.id,
													);
												setPreviewFilters({
													...previewFilters,
													robloxBadgeIds: excluded,
												});
											}
										}, [isIncluded, previewFilters]);

										return (
											<li key={badge.id} className="multi-item-option">
												<button
													type="button"
													className={classNames("roseal-btn", {
														"option-selected": isIncluded,
													})}
													onClick={onClick}
												>
													<Icon
														name={badge.iconName}
														className="badge-zoom"
													/>
												</button>
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					</div>
					<div className="filters-section">
						<div>
							<h3>{getMessage("friends.filters.mutuals.title")}</h3>
						</div>
						<div className="filters-list one-row">
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.mutuals.connections.title")}
								</h5>
								<ul className="filter-options min-max-options">
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.mutuals.connections.min.placeholder",
											)}
											min={0}
											max={MAX_CONNECTIONS_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													minMutualConnectionsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.minMutualConnectionsCount}
										/>
									</li>
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.mutuals.connections.max.placeholder",
											)}
											min={0}
											max={MAX_CONNECTIONS_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													maxMutualConnectionsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.maxMutualConnectionsCount}
										/>
									</li>
								</ul>
							</div>
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.mutuals.communities.title")}
								</h5>
								<div className="filter-options min-max-options">
									<li className="filter-item">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.mutuals.communities.min.placeholder",
											)}
											min={0}
											max={MAX_COMMUNITIES_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													minMutualCommunitiesCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.minMutualCommunitiesCount}
										/>
									</li>
									<li className="filter-item">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.mutuals.communities.max.placeholder",
											)}
											min={0}
											max={MAX_COMMUNITIES_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													maxMutualCommunitiesCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.maxMutualCommunitiesCount}
										/>
									</li>
								</div>
							</div>
						</div>
					</div>
					<div className="filters-section">
						<div>
							<h3>{getMessage("friends.filters.connections.title")}</h3>
						</div>
						<div className="filters-list one-row">
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.connections.title")}
								</h5>
								<ul className="filter-options min-max-options">
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followers.min.placeholder",
											)}
											min={0}
											max={MAX_CONNECTIONS_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													minConnectionsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.minConnectionsCount}
										/>
									</li>
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followers.max.placeholder",
											)}
											min={0}
											max={MAX_CONNECTIONS_LIMIT}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													maxConnectionsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.maxConnectionsCount}
										/>
									</li>
								</ul>
							</div>
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.connections.followings.title")}
								</h5>
								<ul className="filter-options min-max-options">
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followings.min.placeholder",
											)}
											min={0}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													minFollowingsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.minFollowingsCount}
										/>
									</li>
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followings.title",
											)}
											min={0}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													maxFollowingsCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.maxFollowingsCount}
										/>
									</li>
								</ul>
							</div>
							<div className="filter">
								<h5 className="filter-name">
									{getMessage("friends.filters.connections.followers.title")}
								</h5>
								<ul className="filter-options min-max-options">
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followers.min.placeholder",
											)}
											min={0}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													minFollowersCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.minFollowersCount}
										/>
									</li>
									<li className="filter-option">
										<TextInput
											type="number"
											className="value-input"
											placeholder={getMessage(
												"friends.filters.connections.followers.max.placeholder",
											)}
											min={0}
											onChange={(value) => {
												setPreviewFilters({
													...previewFilters,
													maxFollowersCount: value
														? Number.parseInt(value, 10)
														: undefined,
												});
											}}
											step={1}
											value={previewFilters.maxFollowersCount}
										/>
									</li>
								</ul>
							</div>
						</div>
					</div>
					<div className="filters-section">
						<div>
							<h3>{getMessage("friends.filters.connections.joinedDate.title")}</h3>
						</div>
						<div className="filters-list one-row">
							<div className="filter">
								<h5 className="filter-name">
									{getMessage(
										"friends.filters.connections.joinedDate.startingDate.title",
									)}
								</h5>
								<div className="filter-option">
									<input
										type="date"
										className="roseal-date-picker"
										value={minJoinedDateValue}
										max={currentData}
										onChange={(e) => {
											setPreviewFilters({
												...previewFilters,
												minJoinedDate: e.currentTarget.valueAsNumber
													? Math.floor(
															e.currentTarget.valueAsNumber / 1_000,
														)
													: undefined,
											});
										}}
									/>
								</div>
							</div>
							<div className="filter">
								<h5 className="filter-name">
									{getMessage(
										"friends.filters.connections.joinedDate.endingDate.title",
									)}
								</h5>
								<div className="filter-option">
									<input
										type="date"
										className="roseal-date-picker"
										value={maxJoinedDateValue}
										max={currentData}
										onChange={(e) => {
											setPreviewFilters({
												...previewFilters,
												maxJoinedDate: e.currentTarget.valueAsNumber
													? Math.floor(
															e.currentTarget.valueAsNumber / 1_000,
														)
													: undefined,
											});
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="btns-container">
					<Button
						type="control"
						onClick={() =>
							setFilters({
								sortBy: filters.sortBy,
								robloxBadgeIds: [],
							})
						}
						className="revert-filters-btn"
					>
						{getMessage("friends.filters.buttons.revert.buttonText")}
					</Button>
					<Button
						type="primary"
						onClick={() => setFilters(previewFilters)}
						className="apply-filters-btn"
					>
						{getMessage("friends.filters.buttons.apply.buttonText")}
					</Button>
				</div>
			</div>
		</Popover>
	);
}

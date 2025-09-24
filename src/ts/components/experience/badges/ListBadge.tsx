import type { BadgeAwardedDate, BadgeDetails } from "src/ts/helpers/requests/services/badges";
import useFeatureValue from "../../hooks/useFeatureValue";
import classNames from "classnames";
import { getBadgeLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import {
	asLocaleString,
	getAbsoluteTime,
	getShortRelativeTime,
} from "src/ts/helpers/i18n/intlFormats";
import Icon from "../../core/Icon";
import MentionLinkify from "../../core/MentionLinkify";
import Linkify from "../../core/Linkify";
import Tooltip from "../../core/Tooltip";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useRef } from "preact/hooks";

export type ListBadgeProps = {
	badge: BadgeDetails;
	user1?: BadgeAwardedDate;
	user1Username?: string;
	user1Id?: number;
	user2?: BadgeAwardedDate;
	user2Id?: number;
	isComparison?: boolean;
};

export default function ListBadge({
	badge,
	user1,
	user1Username,
	user2,
	isComparison,
}: ListBadgeProps) {
	const [isItemMentionsEnabled] = useFeatureValue("formatItemMentions", false);
	const contentRef = useRef<HTMLAnchorElement>(null);

	const completionPercentage = badge.statistics.winRatePercentage;

	const thumbnail = (
		<Thumbnail
			request={{
				targetId: badge.id,
				type: "BadgeIcon",
				size: "150x150",
			}}
		/>
	);

	const content = (
		<a
			href={getBadgeLink(badge.id, badge.name)}
			className="badge-link-container"
			ref={contentRef}
		>
			<div
				className={classNames("badge-image-container left", {
					"is-unobtained": isComparison && !user1 && user2,
				})}
			>
				{thumbnail}
			</div>
			<div className="badge-info-container">
				<div className="badge-name">
					<h4>{badge.displayName}</h4>
				</div>
				{!isComparison && user1 && (
					<div className="badge-obtained-date text">
						{getMessage("experience.badges.list.item.awardedTime", {
							username: user1Username ?? "",
							time: (
								<Tooltip
									includeContainerClassName={false}
									button={
										<span title={getAbsoluteTime(user1.awardedDate)}>
											{getShortRelativeTime(user1.awardedDate)}
										</span>
									}
								>
									{getAbsoluteTime(user1.awardedDate)}
								</Tooltip>
							),
						})}
					</div>
				)}
				{!badge.enabled && (
					<div className="badge-disabled-text">
						<Icon name="warning" />
						<span className="text-error disabled-text">
							{getMessage("experience.badges.list.item.disabled")}
						</span>
					</div>
				)}
				{!(!badge.enabled && user1) && (
					<div
						className={classNames("badge-description", {
							multiline: badge.enabled && (!user1 || isComparison),
						})}
					>
						{isItemMentionsEnabled ? (
							<MentionLinkify content={badge.displayDescription} />
						) : (
							<Linkify content={badge.displayDescription} />
						)}
					</div>
				)}
			</div>

			{isComparison ? (
				<div
					className={classNames("badge-image-container right", {
						"is-unobtained": user1 && !user2,
					})}
				>
					{thumbnail}
				</div>
			) : (
				<ul className="badge-awarded-stats">
					<li className="yesterday-awarded awarded-stat">
						<div className="text-label">
							{getMessage("experience.badges.list.item.awardedYesterday")}
						</div>
						<div className="font-header-2">
							{getMessage("experience.badges.list.item.awardedYesterday.value", {
								percentage: asLocaleString(completionPercentage, {
									style: "percent",
									minimumFractionDigits: 0,
									maximumFractionDigits: 1,
								}),
								total: (
									<span className="text awarded-count">
										{asLocaleString(badge.statistics.pastDayAwardedCount)}
									</span>
								),
							})}
						</div>
					</li>
					<li className="all-time-awarded awarded-stat">
						<div className="text-label">
							{getMessage("experience.badges.list.item.awardedAllTime")}
						</div>
						<div className="font-header-2">
							{asLocaleString(badge.statistics.awardedCount)}
						</div>
					</li>
				</ul>
			)}
		</a>
	);

	return (
		<li
			className={classNames("badge-container", {
				"is-unobtained": !user1 && !user2,
				disabled: !badge.enabled,
			})}
			style={{
				"--completionPercentage": `${completionPercentage * 100}%`,
			}}
		>
			{content}
		</li>
	);
}

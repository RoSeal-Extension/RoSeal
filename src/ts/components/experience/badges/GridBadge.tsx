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
import type { ListBadgeProps } from "./ListBadge";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useRef } from "preact/hooks";

export default function GridBadge({
	badge,
	user1,
	user1Id,
	user2,
	user2Id,
	isComparison,
}: ListBadgeProps) {
	const [isItemMentionsEnabled] = useFeatureValue("formatItemMentions", false);
	const contentRef = useRef<HTMLAnchorElement>(null);

	const completionPercentage = badge.statistics.winRatePercentage;

	const content = (
		<a
			href={getBadgeLink(badge.id, badge.name)}
			className="badge-link-container"
			ref={contentRef}
		>
			{isComparison && (
				<div className="user-ownership-container">
					<div
						className={classNames("user avatar-headshot-xs", {
							"is-unobtained": !user1,
						})}
					>
						<Thumbnail
							containerClassName="avatar-card-image"
							request={{
								targetId: user1Id!,
								type: "AvatarHeadShot",
								size: "48x48",
							}}
						/>
					</div>
					<div
						className={classNames("user avatar-headshot-xs", {
							"is-unobtained": !user2,
						})}
					>
						<Thumbnail
							containerClassName="avatar-card-image"
							request={{
								targetId: user2Id!,
								type: "AvatarHeadShot",
								size: "48x48",
							}}
						/>
					</div>
				</div>
			)}
			<div className="badge-image-container">
				<Thumbnail
					request={{
						targetId: badge.id,
						type: "BadgeIcon",
						size: "150x150",
					}}
				/>
			</div>
			<div className="badge-info-container">
				<div className="badge-name">
					<h4>{badge.displayName}</h4>
				</div>
			</div>
			<div className="badge-stats">
				{!isComparison && user1 && (
					<div className="badge-obtained-date text">
						{getMessage("experience.badges.grid.item.awardedTime", {
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
							{getMessage("experience.badges.grid.item.disabled")}
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

				<ul className="badge-awarded-stats">
					<li className="rarity awarded-stat">
						<div className="text-label">
							{getMessage("experience.badges.grid.item.rarity")}
						</div>
						<div className="font-header-2">
							{asLocaleString(completionPercentage, {
								style: "percent",
								minimumFractionDigits: 0,
								maximumFractionDigits: 1,
							})}
						</div>
					</li>
					<li className="all-time-awarded awarded-stat">
						<div className="text-label">
							{getMessage("experience.badges.grid.item.awardedAllTime")}
						</div>
						<div className="font-header-2">
							{asLocaleString(badge.statistics.awardedCount)}
						</div>
					</li>
				</ul>
			</div>
		</a>
	);

	return (
		<li
			className={classNames("badge-container", {
				"is-unobtained": !user1 && !user2,
				disabled: !badge.enabled,
			})}
		>
			{content}
		</li>
	);
}

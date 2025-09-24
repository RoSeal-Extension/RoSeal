import classNames from "classnames";
import { useState } from "preact/hooks";
import type { ThumbnailType } from "src/ts/helpers/requests/services/thumbnails";
import Icon from "../core/Icon";
import Loading from "../core/Loading";
import Thumbnail from "../core/Thumbnail";
import type { AgentMentionContainerProps } from "../core/items/AgentMentionContainer";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import { getAbsoluteTime, getShortTime } from "src/ts/helpers/i18n/intlFormats";
import Toggle from "../core/Toggle";
import VerifiedBadge from "../icons/VerifiedBadge";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Tooltip from "../core/Tooltip";

export type BetterNotificationItem = {
	id: number;
	link: string;
	followingSince?: string;
	lastUpdated?: string;
	name: string;
	thumbnailType: ThumbnailType;
	isFollowing: boolean;
	creator?: AgentMentionContainerProps | null;
	hasVerifiedBadge?: boolean;
};

export type BetterNotificationGroupProps = {
	title: string;
	iconName: string;
	description: string;
	offDescription: string;
	toggleFollowing: (id: number) => void;
	items?: BetterNotificationItem[] | null;
};

export type FollowedItemProps = BetterNotificationItem & {
	toggleFollowing: () => void;
	index: number;
};

export function FollowedItem({
	toggleFollowing,
	index,
	id,
	link,
	followingSince,
	lastUpdated,
	name,
	thumbnailType,
	isFollowing,
	creator,
	hasVerifiedBadge,
}: FollowedItemProps) {
	return (
		<div
			className={classNames("preference-button-wrapper", {
				"border-top": index !== 0,
			})}
		>
			<div className="preference-button">
				<Thumbnail
					containerClassName="preference-thumbnail"
					request={{
						type: thumbnailType,
						size: "150x150",
						targetId: id,
					}}
				/>
				<div className="preference-info-wrapper">
					<a className="small text-name text-emphasis preference-name" href={link}>
						{name}
						{hasVerifiedBadge && <VerifiedBadge width={16} height={16} />}
					</a>
					{creator && (
						<div className="small text text-content creator-name">
							{getMessage("robloxSettings.notifications.createdBy", {
								creator: <AgentMentionContainer {...creator} />,
							})}
						</div>
					)}
				</div>
				{(followingSince || lastUpdated) && (
					<div className="followed-info text small">
						{followingSince && (
							<Tooltip
								containerClassName="followed-time"
								as="div"
								includeContainerClassName={false}
								button={
									<span>
										{getMessage("robloxSettings.notifications.followingSince", {
											date: getShortTime(followingSince),
										})}
									</span>
								}
							>
								{getAbsoluteTime(followingSince)}
							</Tooltip>
						)}
						{lastUpdated && (
							<Tooltip
								containerClassName="last-update-time"
								as="div"
								includeContainerClassName={false}
								button={
									<span>
										{getMessage("robloxSettings.notifications.lastUpdated", {
											date: getShortTime(lastUpdated),
										})}
									</span>
								}
							>
								{getAbsoluteTime(lastUpdated)}
							</Tooltip>
						)}
					</div>
				)}
				<div className="toggle-button-container">
					<Toggle isOn={isFollowing} onToggle={toggleFollowing} />
				</div>
			</div>
		</div>
	);
}

export default function BetterNotificationGroup({
	title,
	iconName,
	description,
	toggleFollowing,
	offDescription,
	items,
}: BetterNotificationGroupProps) {
	const [open, setOpen] = useState(false);

	return (
		<div
			className={classNames("group-wrapper better-notification-group", {
				"group-open": open,
			})}
		>
			<button
				type="button"
				className={classNames("toggle-button", {
					"toggle-button-closed": !open,
				})}
				onClick={() => setOpen(!open)}
			>
				<Icon name={iconName} />
				<span className="group-name heading text-emphasis">{title}</span>
				<Icon name={open ? "up" : "down"} />
			</button>
			{open && (
				<div className="selector-list">
					<div className="preference-selector">
						<div className="notification-type-info">
							<div className="notification-descriptor small text text-content">
								{items?.length === 0 ? offDescription : description}
							</div>
						</div>
						{items ? (
							<div>
								{items.map((item, index) => (
									<FollowedItem
										key={item.id}
										{...item}
										toggleFollowing={() => toggleFollowing(item.id)}
										index={index}
									/>
								))}
							</div>
						) : (
							<Loading />
						)}
					</div>
				</div>
			)}
		</div>
	);
}

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
import type {
	GroupNotificationSettingType,
	GroupV1NotificationPreference,
} from "src/ts/helpers/requests/services/groups";

export type BetterNotificationItem = {
	id: number;
	link: string;
	followingSince?: string;
	lastUpdated?: string;
	name: string;
	thumbnailType: ThumbnailType;
	creator?: AgentMentionContainerProps | null;
	hasVerifiedBadge?: boolean;
	preferences?: GroupV1NotificationPreference[];
};

export type BetterNotificationGroupProps = {
	title: string;
	iconName: string;
	description: string;
	offDescription?: string;
	items?: BetterNotificationItem[] | null;
	toggleFollowing: (
		enabled: boolean,
		id: number,
		type?: GroupNotificationSettingType,
	) => MaybePromise<void>;
	setItems?: (data: BetterNotificationItem[]) => void;
};

export type FollowedItemProps = BetterNotificationItem & {
	toggleFollowing: (enabled: boolean, type?: GroupNotificationSettingType) => void;
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
	creator,
	hasVerifiedBadge,
	preferences,
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
				{preferences?.length === 1 && (
					<div className="toggle-button-container">
						<Toggle
							isOn={preferences[0].enabled}
							onToggle={(data) => toggleFollowing(data, preferences[0].type)}
						/>
					</div>
				)}
			</div>
			{preferences?.length && preferences.length > 1 && (
				<div className="preference-selectors">
					{preferences.map((preference) => (
						<div class="preference-selector" key={preference.type}>
							<div class="preference-selector-header">
								<div class="notification-type-info">
									<div class="notification-type heading text text-emphasis">
										{preference.name}
									</div>
									<div class="notification-type-descriptor small text text-content">
										{preference.description}
									</div>
								</div>
								<div class="toggle-button-container">
									<Toggle
										className="receiver-destination-type-toggle"
										isOn={preference.enabled}
										onToggle={(data) => toggleFollowing(data, preference.type)}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function BetterNotificationGroup({
	title,
	iconName,
	description,
	offDescription,
	items,
	toggleFollowing,
	setItems,
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
										index={index}
										toggleFollowing={async (enabled, type) => {
											try {
												await toggleFollowing(enabled, item.id, type);

												if (item.preferences && setItems)
													for (const preference of item.preferences) {
														if (type === preference.type) {
															preference.enabled = enabled;
															setItems([...items]);
															return;
														}
													}
											} catch {}
										}}
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

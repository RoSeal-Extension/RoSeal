import classNames from "classnames";
import { useMemo } from "preact/hooks";
import { FRIENDS_LAST_SEEN_STORAGE_KEY } from "src/ts/constants/friends";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import UserProfileField from "../../core/items/UserProfileField";
import Tooltip from "../../core/Tooltip";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePresence from "../../hooks/usePresence";
import useStorage from "../../hooks/useStorage";
import useTime from "../../hooks/useTime";
import { handleTimeSwitch } from "../../utils/handleTimeSwitch";
import SocialHeaderV2 from "./SocialHeaderV2";

export type UserLastSeenProps = {
	userId: number;
	useV2?: boolean;
};

export default function UserLastSeen({ userId, useV2 }: UserLastSeenProps) {
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [getTime, timeType, setTimeType] = useTime("userProfiles", "time", true);
	const [getTooltipTime, tooltipTimeType] = useTime("userProfiles", "tooltip", true);

	const [storageValue] = useStorage<Record<number, number>>(FRIENDS_LAST_SEEN_STORAGE_KEY, {});
	const lastSeenDate = useMemo(() => {
		if (!storageValue[userId]) return;

		return new Date(storageValue[userId] * 1000);
	}, [storageValue[userId]]);

	const presence = usePresence(userId);

	const isOnline = presence?.userPresenceType !== 0;
	const tooltipTime = lastSeenDate ? getTooltipTime(lastSeenDate) : "...";
	const time = lastSeenDate ? getTime(lastSeenDate) : "...";
	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;
	const innerClass = classNames("text-lead", {
		"time-type-switch": isClickSwitchEnabled && !isOnline && lastSeenDate,
	});

	const inner =
		tooltipTimeType !== undefined && !isOnline && lastSeenDate ? (
			<Tooltip
				as="p"
				containerClassName={innerClass}
				includeContainerClassName={false}
				button={<span onClick={onClick}>{time}</span>}
				title={tooltipTime}
			>
				{tooltipTime}
			</Tooltip>
		) : (
			<p className={innerClass} onClick={onClick}>
				{isOnline
					? getMessage("user.stats.lastSeen.now")
					: lastSeenDate
						? time
						: getMessage("user.stats.lastSeen.notSeen")}
			</p>
		);

	if (useV2) {
		return (
			<SocialHeaderV2
				className="roseal-user-last-seen-v2"
				title={getMessage("user.stats.lastSeen.title")}
				alt={getMessage("user.stats.lastSeen.title")}
				value={inner}
				enabled
				onClick={onClick}
			/>
		);
	}

	return (
		<UserProfileField title={getMessage("user.stats.lastSeen.title")}>{inner}</UserProfileField>
	);
}

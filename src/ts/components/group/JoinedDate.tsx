import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserCommunityJoinedDate } from "src/ts/utils/groups";
import Tooltip from "../core/Tooltip";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import usePromise from "../hooks/usePromise";
import useTime from "../hooks/useTime";
import { handleTimeSwitch } from "../utils/handleTimeSwitch";

export type CommunityJoinedDateProps = {
	groupId: number;
};

export default function CommunityJoinedDate({ groupId }: CommunityJoinedDateProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [joinedDate] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return getUserCommunityJoinedDate(
			groupId,
			authenticatedUser.userId,
			authenticatedUser.userId,
			authenticatedUser.isUnder13,
			true,
		);
	}, [groupId, authenticatedUser?.userId, authenticatedUser?.isUnder13]);

	const [getTimeType, timeType, setTimeType] = useTime("groupProfiles", "time");
	const [getTooltipTimeType, tooltipTimeType] = useTime("groupProfiles", "tooltip");

	const joinedTime = joinedDate ? getTimeType(joinedDate) : "...";
	const joinedTooltipTime = joinedDate ? getTooltipTimeType(joinedDate) : "...";

	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;

	const innerClass = classNames("text-overflow", {
		"time-type-switch": isClickSwitchEnabled,
	});

	return (
		<>
			{joinedDate && (
				<span className="profile-insight-pill flex items-center bg-surface-300 radius-circle text-caption-medium padding-x-medium padding-y-xsmall roseal-joined-date roseal-community-insight">
					{getMessage("group.joined", {
						date:
							tooltipTimeType !== undefined ? (
								<Tooltip
									containerClassName={innerClass}
									includeContainerClassName={false}
									button={<span onClick={onClick}>{joinedTime}</span>}
								>
									{joinedTooltipTime}
								</Tooltip>
							) : (
								<span className={innerClass} onClick={onClick}>
									{joinedTime}
								</span>
							),
					})}
				</span>
			)}
		</>
	);
}

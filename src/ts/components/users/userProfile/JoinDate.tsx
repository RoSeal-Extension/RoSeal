import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserById } from "src/ts/helpers/requests/services/users";
import UserProfileField from "../../core/items/UserProfileField";
import UserProfileFieldV2 from "../../core/items/UserProfileFieldV2";
import Tooltip from "../../core/Tooltip";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePromise from "../../hooks/usePromise";
import useTime from "../../hooks/useTime";
import { handleTimeSwitch } from "../../utils/handleTimeSwitch";

export type UserJoinDateProps = {
	userId: number;
	useV2?: boolean;
};

export default function UserJoinDate({ userId, useV2 }: UserJoinDateProps) {
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [getTime, timeType, setTimeType] = useTime("userProfiles", "time", true);
	const [getTooltipTime, tooltipTimeType] = useTime("userProfiles", "tooltip", true);
	const [createdDate] = usePromise(
		() =>
			getUserById({
				userId,
			}).then((data) => data?.created),
		[],
	);

	const tooltipTime = createdDate ? getTooltipTime(createdDate) : "...";
	const time = createdDate ? getTime(createdDate) : "...";
	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;
	const innerClass = classNames("text-lead", {
		"time-type-switch": isClickSwitchEnabled,
	});

	const inner =
		tooltipTimeType !== undefined ? (
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
				{time}
			</p>
		);

	if (useV2) {
		return (
			<UserProfileFieldV2>
				{getMessage("user.joinDateV2", {
					date: inner,
				})}
			</UserProfileFieldV2>
		);
	}

	return <UserProfileField title={getMessage("user.joinDate")}>{inner}</UserProfileField>;
}

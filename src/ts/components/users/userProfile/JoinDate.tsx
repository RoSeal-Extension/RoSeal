import { getUserById } from "src/ts/helpers/requests/services/users";
import usePromise from "../../hooks/usePromise";
import useTime from "../../hooks/useTime";
import Tooltip from "../../core/Tooltip";
import { handleTimeSwitch } from "../../utils/handleTimeSwitch";
import UserProfileField from "../../core/items/UserProfileField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import classNames from "classnames";
import useFeatureValue from "../../hooks/useFeatureValue";

export type UserJoinDateProps = {
	userId: number;
};

export default function UserJoinDate({ userId }: UserJoinDateProps) {
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

	return (
		<UserProfileField title={getMessage("user.joinDate")}>
			{tooltipTimeType !== undefined ? (
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
			)}
		</UserProfileField>
	);
}

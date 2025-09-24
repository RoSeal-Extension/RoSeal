import { getUserById } from "src/ts/helpers/requests/services/users";
import usePromise from "../hooks/usePromise";
import useTime from "../hooks/useTime";
import Tooltip from "../core/Tooltip";
import { handleTimeSwitch } from "../utils/handleTimeSwitch";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import ExperienceField from "../core/items/ExperienceField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import useFeatureValue from "../hooks/useFeatureValue";
import classNames from "classnames";

export type ExperienceCreatedDateProps = {
	placeId: number;
};

export default function ExperienceCreatedDate({ placeId }: ExperienceCreatedDateProps) {
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [switchCreatedUpdated] = useFeatureValue("times.switchCreatedUpdated", false);

	const [getTime, timeType, setTimeType] = useTime("experiences", "time", true);
	const [getTooltipTime, tooltipTimeType] = useTime("experiences", "tooltip", true);
	const [data] = usePromise(
		() =>
			getAssetById({
				assetId: placeId,
			}),
		[],
	);

	const createdTooltipTime = data ? getTooltipTime(data.created) : "...";
	const createdTime = data ? getTime(data.created) : "...";

	const updatedTooltipTime = data ? getTooltipTime(data.updated) : "...";
	const updatedTime = data ? getTime(data.updated) : "...";

	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;
	const innerClass = classNames("text-lead font-caption-body", {
		"time-type-switch": isClickSwitchEnabled,
	});

	const updatedField = (
		<ExperienceField title={getMessage("item.updated")}>
			{tooltipTimeType !== undefined ? (
				<Tooltip
					as="p"
					containerClassName={innerClass}
					includeContainerClassName={false}
					button={<span onClick={onClick}>{updatedTime}</span>}
					title={updatedTooltipTime}
				>
					{updatedTooltipTime}
				</Tooltip>
			) : (
				<p className={innerClass} onClick={onClick}>
					{updatedTime}
				</p>
			)}
		</ExperienceField>
	);

	const createdField = (
		<ExperienceField title={getMessage("item.created")}>
			{tooltipTimeType !== undefined ? (
				<Tooltip
					as="p"
					containerClassName={innerClass}
					includeContainerClassName={false}
					button={<span onClick={onClick}>{createdTime}</span>}
					title={createdTooltipTime}
				>
					{createdTooltipTime}
				</Tooltip>
			) : (
				<p className={innerClass} onClick={onClick}>
					{createdTime}
				</p>
			)}
		</ExperienceField>
	);

	return (
		<>
			{!switchCreatedUpdated && createdField}
			{updatedField}
			{switchCreatedUpdated && createdField}
		</>
	);
}

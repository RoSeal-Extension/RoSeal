import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getBadgeById, multigetBadgesAwardedDates } from "src/ts/helpers/requests/services/badges";
import Tooltip from "../core/Tooltip";
import ItemField from "../core/items/ItemField";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import usePromise from "../hooks/usePromise";
import useTime from "../hooks/useTime";
import { handleTimeSwitch } from "../utils/handleTimeSwitch";

export type BadgeAwardedStatsProps = {
	badgeId: number;
};

export default function BadgeAwardedStats({ badgeId }: BadgeAwardedStatsProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [awardedDate] = usePromise(
		() =>
			authenticatedUser &&
			multigetBadgesAwardedDates({
				badgeIds: [badgeId],
				userId: authenticatedUser.userId,
			}).then((data) => {
				const date = data[0]?.awardedDate;
				if (date) return new Date(date);
			}),
		[badgeId, authenticatedUser?.userId],
	);

	const [data] = usePromise(
		() =>
			getBadgeById({
				badgeId,
			}),
		[badgeId],
	);

	const [getTime, timeType, setTimeType] = useTime("associatedItems", "time");
	const [getTooltipTime, tooltipTimeType] = useTime("associatedItems", "tooltip", true);

	const tooltipTime = awardedDate && getTooltipTime(awardedDate);
	const time = awardedDate && getTime(awardedDate);

	const innerClass = classNames("date", {
		"time-type-switch": isClickSwitchEnabled,
	});
	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;

	return (
		<>
			<ItemField
				id="badge-awarded-count"
				title={getMessage("badge.awarded")}
				useNewClasses={false}
			>
				<div className="font-body text badge-awarded-count-list">
					<span className="font-body text">
						{getMessage("badge.awarded.allTime", {
							count: asLocaleString(data?.statistics.awardedCount || 0),
						})}
					</span>
					<span className="font-body text">
						{getMessage("badge.awarded.yesterday", {
							count: asLocaleString(data?.statistics.pastDayAwardedCount || 0),
							percentage: asLocaleString(
								(data?.statistics.winRatePercentage || 0) * 100,
							),
						})}
					</span>
				</div>
			</ItemField>
			{awardedDate && (
				<ItemField
					id="badge-awarded-time"
					title={getMessage("badge.awardedToYou")}
					useNewClasses={false}
				>
					<span className="font-body text">
						{tooltipTimeType !== undefined ? (
							<Tooltip
								includeContainerClassName={false}
								id="item-updated-field"
								button={<span onClick={onClick}>{time}</span>}
								containerClassName={innerClass}
								title={tooltipTime || undefined}
							>
								{tooltipTime}
							</Tooltip>
						) : (
							<span id="item-updated-field" className={innerClass} onClick={onClick}>
								{time}
							</span>
						)}
					</span>
				</ItemField>
			)}
		</>
	);
}

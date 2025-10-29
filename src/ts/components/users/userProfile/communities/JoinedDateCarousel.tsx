import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useMemo } from "preact/hooks";
import Tooltip from "src/ts/components/core/Tooltip";
import useAuthenticatedUser from "src/ts/components/hooks/useAuthenticatedUser";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";
import useTime from "src/ts/components/hooks/useTime";
import { handleTimeSwitch } from "src/ts/components/utils/handleTimeSwitch";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserCommunityJoinedDate } from "src/ts/utils/groups";

export type UserCommunityJoinedDateCarouselProps = {
	userId: number;
	groupId: number;
	state: Signal<Record<number, string>>;
};

export default function UserCommunityJoinedDateCarousel({
	userId,
	groupId,
	state,
}: UserCommunityJoinedDateCarouselProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const joinedDate = useMemo(() => {
		return state.value[groupId];
	}, [state.value]);

	const [getTimeType, timeType, setTimeType] = useTime("userProfiles", "time");
	const [getTooltipTimeType, tooltipTimeType] = useTime("userProfiles", "tooltip");

	const joinedTime = joinedDate
		? getTimeType(joinedDate)
		: getMessage("user.communities.community.check");
	const joinedTooltipTime = joinedDate ? getTooltipTimeType(joinedDate) : "...";

	const onTimeClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;
	const onClick = () => {
		if (joinedDate) {
			return onTimeClick?.();
		}

		if (!authenticatedUser) return;

		getUserCommunityJoinedDate(
			groupId,
			userId,
			authenticatedUser.userId,
			authenticatedUser.isUnder13,
			true,
		).then((date) => {
			if (date) {
				state.value = {
					...state.value,
					[groupId]: date,
				};
			}
		});
	};

	const innerClass = classNames("text-lead text-overflow group-joined-date groups", {
		"time-type-switch": isClickSwitchEnabled,
	});

	return (
		<li className="list-item">
			<div className="text-label slide-item-stat-title">
				{getMessage("user.communities.community.joinedLabel")}
			</div>
			<div className="text-lead text-overflow group-joined-date groups">
				{tooltipTimeType !== undefined && joinedDate ? (
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
				)}
			</div>
		</li>
	);
}

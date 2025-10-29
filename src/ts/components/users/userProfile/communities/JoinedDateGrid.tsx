import classNames from "classnames";
import { useMemo } from "preact/hooks";
import Tooltip from "src/ts/components/core/Tooltip";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";
import useTime from "src/ts/components/hooks/useTime";
import { handleTimeSwitch } from "src/ts/components/utils/handleTimeSwitch";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserCommunityJoinedDate } from "src/ts/utils/groups";
import type { UserCommunityJoinedDateCarouselProps } from "./JoinedDateCarousel";
import useAuthenticatedUser from "src/ts/components/hooks/useAuthenticatedUser";

export default function UserCommunityJoinedDateGrid({
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

	const innerClass = classNames(
		"text-overflow game-card-name-secondary group-joined-date text align-left",
		{
			"time-type-switch": isClickSwitchEnabled,
		},
	);

	return tooltipTimeType !== undefined && joinedDate ? (
		<Tooltip
			as="div"
			containerClassName={innerClass}
			includeContainerClassName={false}
			button={
				<span onClick={onClick}>
					{getMessage("user.communities.community.joined", {
						date: joinedTime,
					})}
				</span>
			}
		>
			{joinedTooltipTime}
		</Tooltip>
	) : (
		<div className={innerClass} onClick={onClick}>
			{getMessage("user.communities.community.joined", {
				date: joinedTime,
			})}
		</div>
	);
}

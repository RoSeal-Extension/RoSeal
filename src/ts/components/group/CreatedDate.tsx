import classNames from "classnames";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getOpenCloudGroup, listGroupMembersV2 } from "src/ts/helpers/requests/services/groups";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import Tooltip from "../core/Tooltip";
import useFeatureValue from "../hooks/useFeatureValue";
import useProfileData from "../hooks/useProfileData";
import usePromise from "../hooks/usePromise";
import useTime from "../hooks/useTime";
import { handleTimeSwitch } from "../utils/handleTimeSwitch";

export type GroupCreatedDateProps = {
	groupId: number;
};

export default function GroupCreatedDate({ groupId }: GroupCreatedDateProps) {
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [isShowOriginalCreatorEnabled] = useFeatureValue(
		"showGroupCreatedDate.showOriginalCreator",
		false,
	);
	const [groupData] = usePromise(
		() =>
			getOpenCloudGroup({
				groupId,
			}),
		[groupId],
	);
	const [firstMember] = usePromise(() => {
		if (!isShowOriginalCreatorEnabled) {
			return;
		}

		return listGroupMembersV2({
			groupId,
			maxPageSize: 1,
		}).then((data) => data.groupMemberships[0]);
	}, [isShowOriginalCreatorEnabled, groupId]);
	const originalCreatorId = useMemo(() => {
		if (!isShowOriginalCreatorEnabled || !firstMember || !groupData) {
			return;
		}

		const firstMemberCreateDate = new Date(firstMember.createTime);
		const groupCreateDate = new Date(groupData.createTime);

		// if firstMemberCreatedDate is 1.5 seconds or less after group create time
		// then we assume the first member is the original creator

		if (firstMemberCreateDate.getTime() - groupCreateDate.getTime() <= 1_500) {
			return Number.parseInt(firstMember.user.split("/")[1], 10);
		}
	}, [isShowOriginalCreatorEnabled, firstMember, groupData]);
	const originalCreatorProfile = useProfileData(
		originalCreatorId
			? {
					userId: originalCreatorId,
				}
			: undefined,
	);

	const [getTimeType, timeType, setTimeType] = useTime("groupProfiles", "time");
	const [getTooltipTimeType, tooltipTimeType] = useTime("groupProfiles", "tooltip");

	const createdTime = groupData?.createTime ? getTimeType(groupData.createTime) : "...";
	const createdTooltipTime = groupData?.createTime
		? getTooltipTimeType(groupData.createTime)
		: "...";

	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;

	const innerClass = classNames("font-caption-header text-emphasis", {
		"time-type-switch": isClickSwitchEnabled,
	});

	const time =
		tooltipTimeType !== undefined ? (
			<Tooltip
				containerClassName={innerClass}
				includeContainerClassName={false}
				button={<span onClick={onClick}>{createdTime}</span>}
			>
				{createdTooltipTime}
			</Tooltip>
		) : (
			<span className={innerClass} onClick={onClick}>
				{createdTime}
			</span>
		);
	return (
		<>
			{groupData?.createTime && (
				<div className="group-created-date">
					<span className="text-label font-caption-header">
						{originalCreatorProfile
							? getMessage("group.created2.withCreator", {
									time,
									creator: (
										<AgentMentionContainer
											targetType="User"
											targetId={originalCreatorProfile.userId}
											name={originalCreatorProfile.names.combinedName}
											hasVerifiedBadge={originalCreatorProfile.isVerified}
											includeThumbnail={false}
										/>
									),
								})
							: getMessage("group.created2", {
									time,
								})}
					</span>
				</div>
			)}
		</>
	);
}

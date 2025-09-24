import classNames from "classnames";
import type { TimeTarget } from "src/ts/helpers/features/featuresData";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase } from "src/ts/helpers/i18n/intlFormats";
import { getAssetById, multigetDevelopAssetsByIds } from "src/ts/helpers/requests/services/assets";
import { getBadgeById } from "src/ts/helpers/requests/services/badges";
import { getDeveloperProductById } from "src/ts/helpers/requests/services/developerProducts";
import type {
	AnyItemType,
	LiterallyAnyItemType,
} from "src/ts/helpers/requests/services/marketplace";
import { getAvatarItem, getLookById } from "src/ts/helpers/requests/services/marketplace";
import { getPassById } from "src/ts/helpers/requests/services/passes";
import { getExperienceEventById } from "src/ts/helpers/requests/services/universes";
import { getUserById } from "src/ts/helpers/requests/services/users";
import { getMostFrequentCreator } from "src/ts/utils/assets";
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import Tooltip from "../core/Tooltip";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import ExperienceEventField from "../core/items/ExperienceEventField";
import ItemField from "../core/items/ItemField";
import LookField from "../core/items/LookField";
import useFeatureValue from "../hooks/useFeatureValue";
import usePromise from "../hooks/usePromise";
import useTime from "../hooks/useTime";
import { handleTimeSwitch } from "../utils/handleTimeSwitch";
import { escapeRegExp } from "src/ts/utils/regex";

export type ItemUpdatedCreatedProps = {
	itemType: LiterallyAnyItemType;
	itemId: number;
	updatedBy?: {
		itemType: AnyItemType;
		itemId: number;
		userId: number;
	};
	target: TimeTarget;
};

export default function ItemUpdatedCreated({
	itemType,
	itemId,
	updatedBy,
	target,
}: ItemUpdatedCreatedProps) {
	const [isClickSwitchEnabled] = useFeatureValue("times.clickSwitch", false);
	const [showActors] = useFeatureValue("avatarItemCreatedUpdated.showActors", false);
	const [switchCreatedUpdated] = useFeatureValue("times.switchCreatedUpdated", false);
	const [getTime, timeType, setTimeType] = useTime(target, "time");
	const [getTooltipTime, tooltipTimeType] = useTime(target, "tooltip");
	const [data] = usePromise(() => {
		if (itemType === "Bundle") {
			return getAvatarItem({
				itemId,
				itemType: "Bundle",
			}).then(async (bundle) => {
				if (!bundle) {
					return;
				}

				const assetIds: number[] = [];
				for (const item of bundle.bundledItems) {
					if (item.type === "Asset") {
						assetIds.push(item.id);
					}
				}

				const itemsData = await multigetDevelopAssetsByIds({
					assetIds,
				});
				let updated: string | undefined;
				let created: string | undefined;
				const createdUtcFromApi = (
					await getAvatarItem({
						itemType: "Bundle",
						itemId,
					})
				)?.itemCreatedUtc;

				if (createdUtcFromApi) {
					created = createdUtcFromApi;
				}

				let originalName: string | undefined;
				for (const item of itemsData) {
					if (!updated || new Date(item.updated) > new Date(updated)) {
						updated = item.updated;
					}

					// Step 1 - match name with bundle name (replace # with .) and determine the original name of the bundle
					if (
						!createdUtcFromApi &&
						(!created || new Date(item.created) < new Date(created))
					) {
						const split = item.name.split(" - ");
						if (split.length !== 2) {
							continue;
						}

						if (
							new RegExp(
								asLocaleLowerCase(escapeRegExp(split[0]).replaceAll("#", ".")),
								"i",
							).test(asLocaleLowerCase(bundle.name)) ||
							originalName === split[0]
						) {
							created = item.created;
						}

						if (!originalName) {
							originalName = split[0];
						}
					}
				}

				// Step 2 - match item if its not usually a template asset and the creator matches
				if (!created) {
					for (const item of itemsData) {
						const typeData = getAssetTypeData(item.typeId);
						if (
							!typeData?.isUsuallyTemplate &&
							bundle.creatorType === item.creator.type &&
							bundle.creatorTargetId === item.creator.targetId &&
							(!created || new Date(item.created) < new Date(created))
						) {
							created = item.created;
						}
					}

					// step 3 - just get the oldest date
					if (!created)
						for (const item of itemsData) {
							if (!created || new Date(item.created) < new Date(created)) {
								created = item.created;
							}
						}
				}

				return {
					updated,
					created,
				};
			});
		}

		if (itemType === "Asset") {
			return getAssetById({
				assetId: itemId,
			}).catch(() =>
				multigetDevelopAssetsByIds({
					assetIds: [itemId],
				}).then(
					(data) =>
						data[0] && {
							updated: data[0].updated,
							created: data[0].created,
						},
				),
			);
		}

		if (itemType === "Badge") {
			return getBadgeById({
				badgeId: itemId,
			});
		}

		if (itemType === "GamePass") {
			return getPassById({
				passId: itemId,
			}).then((data) => ({
				updated: data.updatedTimestamp,
				created: data.createdTimestamp,
			}));
		}

		if (itemType === "DeveloperProduct") {
			return getDeveloperProductById({
				developerProductId: itemId,
			});
		}

		if (itemType === "Look") {
			return getLookById({
				lookId: itemId.toString(),
			}).then(
				(data) =>
					data.look && {
						updated: data.look.updatedTime,
						created: data.look.createdTime,
					},
			);
		}

		if (itemType === "ExperienceEvent") {
			return getExperienceEventById({
				eventId: itemId.toString(),
			}).then((data) => ({
				updated: data.updatedUtc,
				created: data.createdUtc,
			}));
		}
	}, [itemType, itemId]);
	const [creator] = usePromise(async () => {
		if (!showActors || itemType !== "Asset") {
			return;
		}

		const [mostFrequent, asset] = await Promise.all([
			getMostFrequentCreator(itemId, 1),
			getAssetById({
				assetId: itemId,
			}),
		]);

		if (
			(mostFrequent?.creatorType === asset?.creator.creatorType &&
				mostFrequent?.creatorTargetId === asset?.creator.creatorTargetId) ||
			(updatedBy &&
				mostFrequent?.creatorType === "User" &&
				mostFrequent?.creatorTargetId === updatedBy?.userId)
		) {
			return;
		}

		return mostFrequent;
	}, [itemType, itemId, !!updatedBy, showActors]);
	const [updater] = usePromise(() => {
		if (!showActors || itemType !== updatedBy?.itemType || itemId !== updatedBy.itemId) {
			return;
		}

		return getUserById({
			userId: updatedBy.userId,
		});
	}, [itemType, itemId, !!updatedBy, showActors]);

	const createdTooltipTime = data?.created ? getTooltipTime(data.created) : "...";
	const createdTime = data?.created ? getTime(data.created) : "...";

	const updatedTooltipTime = data?.updated ? getTooltipTime(data.updated) : "...";
	const updatedTime = data?.updated ? getTime(data.updated) : "...";

	const innerClass = classNames("date", {
		"time-type-switch": isClickSwitchEnabled,
	});
	const onClick = isClickSwitchEnabled
		? () => handleTimeSwitch(timeType, setTimeType)
		: undefined;

	const createdDate =
		tooltipTimeType !== undefined ? (
			<Tooltip
				includeContainerClassName={false}
				id="item-created-field"
				button={<span onClick={onClick}>{createdTime}</span>}
				containerClassName={innerClass}
				title={createdTooltipTime}
			>
				{createdTooltipTime}
			</Tooltip>
		) : (
			<span id="item-created-field" onClick={onClick} className={innerClass}>
				{createdTime}
			</span>
		);

	const updatedDate =
		tooltipTimeType !== undefined ? (
			<Tooltip
				includeContainerClassName={false}
				id="item-updated-field"
				button={<span onClick={onClick}>{updatedTime}</span>}
				containerClassName={innerClass}
				title={updatedTooltipTime}
			>
				{updatedTooltipTime}
			</Tooltip>
		) : (
			<span onClick={onClick} id="item-updated-field" className={innerClass}>
				{updatedTime}
			</span>
		);

	const updatedField =
		itemType === "Look" ? (
			<LookField id="item-updated-field" title={getMessage("item.updated")} className="text">
				<div className="row-content">{updatedDate}</div>
			</LookField>
		) : itemType === "ExperienceEvent" ? (
			<ExperienceEventField title={getMessage("item.updated")} className="text">
				<div className="text-emphasis">{updatedDate}</div>
			</ExperienceEventField>
		) : (
			<ItemField
				id="item-updated-field"
				title={getMessage("item.updated")}
				useNewClasses={target === "avatarItems"}
			>
				<span className="font-body text">
					{updater
						? getMessage("item.createdUpdatedBy", {
								date: updatedDate,
								creator: (
									<AgentMentionContainer
										targetId={updater.id}
										targetType="User"
										hasVerifiedBadge={updater.hasVerifiedBadge}
										name={updater.name}
									/>
								),
							})
						: updatedDate}
				</span>
			</ItemField>
		);

	const createdField =
		itemType === "Look" ? (
			<LookField id="item-created-field" title={getMessage("item.created")} className="text">
				<div className="row-content">{createdDate}</div>
			</LookField>
		) : itemType === "ExperienceEvent" ? (
			<ExperienceEventField title={getMessage("item.created")} className="text">
				<div className="text-emphasis">{createdDate}</div>
			</ExperienceEventField>
		) : (
			<ItemField
				id="item-created-field"
				title={getMessage("item.created")}
				useNewClasses={target === "avatarItems"}
			>
				<span className="font-body text">
					{creator
						? getMessage("item.createdUpdatedBy", {
								date: createdDate,
								creator: (
									<AgentMentionContainer
										targetId={creator.creatorTargetId}
										targetType={creator.creatorType!}
										hasVerifiedBadge={creator.hasVerifiedBadge}
										name={creator.name!}
									/>
								),
							})
						: createdDate}
				</span>
			</ItemField>
		);

	return (
		<>
			{!switchCreatedUpdated && createdField}
			{updatedField}
			{switchCreatedUpdated && createdField}
		</>
	);
}

import MdOutlineVisibility from "@material-symbols/svg-400/outlined/visibility-fill.svg";
import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { allowedItemsData, blockedItemsData } from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase } from "src/ts/helpers/i18n/intlFormats";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor";
import { type Agent, multigetDevelopAssetsByIds } from "src/ts/helpers/requests/services/assets";
import { getGroupById } from "src/ts/helpers/requests/services/groups";
import { getAvatarItem } from "src/ts/helpers/requests/services/marketplace";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import {
	getGeneralReportAbuseLink,
	getGeneralReportAbuseLinkV2,
	getRoSealSettingsLink,
} from "src/ts/utils/links";
import Button from "../core/Button";
import Thumbnail from "../core/Thumbnail";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import { blockedItemsKeywordToRegEx } from "src/ts/utils/blockedItems";

type ItemBlockedScreenCreator = {
	id: number;
	type: Agent;
	name: string;
	hasVerifiedBadge: boolean;
};

type ItemBlockedScreenData = {
	assetType?: string;
	name: string;
	creator?: ItemBlockedScreenCreator;
	reportAssetId: number;
	description?: string;
};

export type ItemBlockedScreenProps = {
	itemId: number;
	itemType: "Asset" | "Bundle" | "Universe";
	name?: string;
	isHidden?: boolean;
};

export default function ItemBlockedScreen({
	itemId,
	itemType,
	name,
	isHidden,
}: ItemBlockedScreenProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [data] = usePromise<() => MaybePromise<ItemBlockedScreenData | undefined>>(() => {
		const getHiddenDetails = () =>
			multigetDevelopAssetsByIds({
				assetIds: [itemId],
			}).then(async (data) => {
				const item = data[0];
				let creator: ItemBlockedScreenCreator | undefined;
				if (item.creator.type === "Group") {
					const details = await getGroupById({
						groupId: item.creator.targetId,
					});
					creator = {
						id: details.id,
						type: "Group",
						name: details.name,
						hasVerifiedBadge: details.hasVerifiedBadge,
					};
				} else {
					const details = await profileProcessor.request({
						userId: item.creator.targetId,
					});

					creator = {
						id: details.userId,
						type: "User",
						name: details.names.username,
						hasVerifiedBadge: details.isVerified,
					};
				}

				return {
					assetType: item.type,
					name: item.name,
					creator,
					reportAssetId: itemId,
					description: item.description,
				};
			});

		if (itemType === "Asset" || itemType === "Bundle") {
			if (isHidden) {
				if (itemType === "Asset") {
					return getHiddenDetails();
				}
				return;
			}

			return getAvatarItem({
				itemId,
				itemType,
			})
				.then(
					(data) =>
						data && {
							assetType: getAssetTypeData(data.assetType)?.assetType,
							name: data.name,
							creator: {
								id: data.creatorTargetId,
								type: data.creatorType,
								name: data.creatorName,
								hasVerifiedBadge: data.creatorHasVerifiedBadge,
							},
							reportAssetId: itemId,
							description: data.description,
						},
				)
				.catch((err) => {
					if (itemType === "Asset") {
						return getHiddenDetails();
					}

					throw err;
				});
		}

		if (itemType === "Universe") {
			return multigetUniversesByIds({
				universeIds: [itemId],
			}).then(
				(data) =>
					data[0] && {
						name: data[0].name,
						creator: {
							id: data[0].creator.id,
							type: data[0].creator.type,
							name: data[0].creator.name,
							hasVerifiedBadge: data[0].creator.hasVerifiedBadge,
						},
						reportAssetId: data[0].rootPlaceId,
						description: data[0].description,
					},
			);
		}
	}, [itemId, itemType]);
	const [bypassScreen, setBypassScreen] = useState(false);

	const realName = name ?? data?.name;
	const { blockedType, keywords } = useMemo(() => {
		let blockedTypes: ("Explicit" | "Creator" | "Name" | "Description" | undefined)[] = [];
		const keywords: string[] = [];

		if (blockedItemsData.value) {
			if (data) {
				if (
					allowedItemsData.value?.creators.some(
						(creator) =>
							creator.id === data.creator?.id && creator.type === data.creator.type,
					)
				) {
					return { blockedType: undefined, otherCount: 0, keywords: [] };
				}

				if (
					blockedItemsData.value.creators.some(
						(creator) =>
							creator.id === data.creator?.id && creator.type === data.creator.type,
					)
				) {
					blockedTypes.push("Creator");
				}
			}

			const realName = asLocaleLowerCase(name ?? data?.name ?? "");

			if (itemType === "Universe") {
				if (blockedItemsData.value.experiences.ids.includes(itemId)) {
					blockedTypes.push("Explicit");
				}

				if (realName) {
					for (const keyword of blockedItemsData.value.experiences.names) {
						if (
							blockedItemsKeywordToRegEx.value[keyword]
								? blockedItemsKeywordToRegEx.value[keyword].test(realName)
								: realName.includes(keyword)
						) {
							blockedTypes.push("Name");
							keywords.push(keyword);
						}
					}
				}

				if (data?.description) {
					const realDescription = asLocaleLowerCase(data.description);
					for (const keyword of blockedItemsData.value.experiences.descriptions) {
						if (
							blockedItemsKeywordToRegEx.value[keyword]
								? blockedItemsKeywordToRegEx.value[keyword].test(realDescription)
								: realDescription.includes(keyword)
						) {
							blockedTypes.push("Description");
							keywords.push(keyword);
						}
					}
				}

				if (allowedItemsData.value?.experiences.ids.includes(itemId)) {
					blockedTypes = [];
				}
			}

			if (itemType === "Asset" || itemType === "Bundle") {
				if (
					blockedItemsData.value.items.items.some(
						(item) => item.id === itemId && item.type === itemType,
					)
				) {
					blockedTypes.push("Explicit");
				}

				if (realName) {
					for (const keyword of blockedItemsData.value.items.names) {
						if (
							blockedItemsKeywordToRegEx.value[keyword]
								? blockedItemsKeywordToRegEx.value[keyword].test(realName)
								: realName.includes(keyword)
						) {
							blockedTypes.push("Name");
							keywords.push(keyword);
						}
					}
				}

				if (data?.description) {
					const realDescription = asLocaleLowerCase(data.description);
					for (const keyword of blockedItemsData.value.items.descriptions) {
						if (
							blockedItemsKeywordToRegEx.value[keyword]
								? blockedItemsKeywordToRegEx.value[keyword].test(realDescription)
								: realDescription.includes(keyword)
						) {
							blockedTypes.push("Description");
							keywords.push(keyword);
						}
					}
				}

				if (
					allowedItemsData.value?.items.items.some(
						(item) => item.id === itemId && item.type === itemType,
					)
				) {
					blockedTypes = [];
				}
			}
		}

		return {
			blockedType: blockedTypes[0],
			otherCount: blockedTypes.length - 1,
			keywords,
		};
	}, [
		name,
		data,
		blockedItemsData.value,
		allowedItemsData.value,
		blockedItemsKeywordToRegEx.value,
	]);

	useEffect(() => {
		setBypassScreen(!blockedType);
	}, [blockedType]);

	const [useHoverEffect, setUseHoverEffect] = useState(false);
	const translationPrefix = useMemo(() => {
		if (itemType === "Universe") {
			return "experience";
		}

		return "item";
	}, [itemType]);
	const reportAbuseUrl = useMemo(() => {
		if (!data) return;

		if (itemType === "Universe") {
			return getGeneralReportAbuseLink("Asset", data.reportAssetId);
		}

		let custom: string | undefined;
		if (data.assetType) {
			custom = JSON.stringify({
				assetType: data.assetType,
			});
		}

		return getGeneralReportAbuseLinkV2(itemId, itemType, authenticatedUser?.userId, custom);
	}, [itemType, itemId, data, authenticatedUser?.userId]);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const parent = ref.current?.parentElement;

		if (parent && blockedType && !bypassScreen) {
			parent.classList.add("item-is-blocked");
		}
	}, [blockedType, ref.current, bypassScreen]);

	if (bypassScreen || !blockedType) {
		return null;
	}

	return (
		<div className="item-blocked-screen" ref={ref}>
			<div className="item-blocked">
				<div className="blocked-preview">
					<Thumbnail
						containerClassName={classNames("blocked-preview-image", {
							"hover-effect": useHoverEffect,
						})}
						request={{
							type:
								itemType === "Universe"
									? "GameIcon"
									: itemType === "Asset"
										? "Asset"
										: "BundleThumbnail",
							targetId: itemId,
							size: "420x420",
						}}
					>
						<button
							type="button"
							onMouseLeave={() => setUseHoverEffect(false)}
							onClick={() => setUseHoverEffect(true)}
							className="hide-preview-image-btn roseal-btn"
						>
							<MdOutlineVisibility className="roseal-icon" />
						</button>
					</Thumbnail>
					<div className="blocked-preview-names">
						{realName && <h2 className="blocked-item-name">{realName}</h2>}
						{data?.creator && (
							<div className="blocked-creator-name text">
								{getMessage("item.by", {
									creator: (
										<AgentMentionContainer
											targetType={data.creator.type}
											targetId={data.creator.id}
											name={data.creator.name}
											hasVerifiedBadge={data.creator.hasVerifiedBadge}
										/>
									),
								})}
							</div>
						)}
						{reportAbuseUrl && (
							<a className="report-abuse-link text-error" href={reportAbuseUrl}>
								{getMessage("item.reportAbuse")}
							</a>
						)}
					</div>
				</div>
				<h2 className="block-title">
					{getMessage(`item.viewBlocked.title.${translationPrefix}`)}
				</h2>
				<span className="text block-view-text">
					{getMessage(`item.viewBlocked.message.${translationPrefix}`)}
				</span>
				<div className="action-btns">
					<Button
						className="view-btn"
						onClick={() => {
							const parent = ref.current?.parentElement;
							if (parent) {
								parent.classList.remove("item-is-blocked");
							}

							setBypassScreen(true);
						}}
					>
						{getMessage(`item.viewBlocked.view.${translationPrefix}`)}
					</Button>
				</div>
				<span className="text-footer">
					{getMessage(`item.viewBlocked.footer.${translationPrefix}.${blockedType}`, {
						keyword: <span className="blocked-keyword">{keywords[0]}</span>,
						settingsLink: (contents: string) => (
							<a href={getRoSealSettingsLink("blocked_items")} className="text-link">
								{contents}
							</a>
						),
					})}
				</span>
			</div>
		</div>
	);
}

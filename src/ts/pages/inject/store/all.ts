import {
	badgeAssetTypeId,
	getAssetTypeData,
	passAssetTypeId,
	placeAssetTypeId,
} from "src/ts/utils/itemTypes";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getAvatarAssetLink, getExperienceLink } from "src/ts/utils/links";

export default {
	id: "all",
	isAllPages: true,
	sites: ["store"],
	fn: () => {
		featureValueIsInject("viewOffsaleStoreItems", true, () => {
			hijackResponse((req, res) => {
				if (res?.ok) return;

				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("apis")) {
					if (url.pathname === "/toolbox-service/v1/items/details") {
						const idStr = url.searchParams.get("assetIds")?.split(",")[0];
						if (!idStr) {
							return;
						}

						const id = Number.parseInt(idStr, 10);
						return getAssetById({
							assetId: id,
						}).then((details) => {
							if (details.assetTypeId === placeAssetTypeId) {
								location.href = getExperienceLink(id, details.name);
								return;
							}

							if (
								getAssetTypeData(details.assetTypeId)?.isAvatarAsset ||
								[passAssetTypeId, badgeAssetTypeId].includes(details.assetTypeId)
							) {
								location.href = getAvatarAssetLink(id, details.name);
								return;
							}

							return new Response(
								JSON.stringify({
									data: [
										{
											asset: {
												audioDetails: null,
												id,
												name: details.name,
												typeId: details.assetTypeId || -1,
												assetSubTypes: null,
												assetGenres: ["All"],
												ageGuidelines: null,
												isEndorsed: false,
												description: details.description,
												duration: 0,
												createdUtc: details.created,
												updatedUtc: details.updated,
												creatingUniverseId: null,
												isAssetHashApproved: true,
												visibilityStatus: null,
											},
											creator: {
												id: details.creator.creatorTargetId,
												name: details.creator.name,
												type:
													details.creator.creatorType === "User" ? 1 : 2,
												isVerifiedCreator: true,
												latestGroupUpdaterUserId: null,
												latestGroupUpdaterUserName: null,
											},
											voting: {
												showVotes: false,
												upVotes: 0,
												downVotes: 0,
												canVote: false,
												userVote: null,
												hasVoted: false,
												voteCount: 0,
												upVotePercent: 0,
											},
											fiatProduct: {
												purchasePrice: {
													currencyCode: "USD",
													quantity: {
														significand: 0,
														exponent: 0,
													},
												},
												published: true,
												purchasable: details.isPublicDomain,
											},
										},
									],
								}),
								{
									...res,
									status: 200,
								},
							);
						});
					}

					const match = url.pathname.match(/^\/toolbox-service\/v2\/assets\/(\d+)$/);
					if (match) {
						const id = Number.parseInt(match[1], 10);

						return getAssetById({
							assetId: id,
						}).then((details) => {
							if (details.assetTypeId === placeAssetTypeId) {
								location.href = getExperienceLink(id, details.name);
								return;
							}

							if (
								getAssetTypeData(details.assetTypeId)?.isAvatarAsset ||
								[passAssetTypeId, badgeAssetTypeId].includes(details.assetTypeId)
							) {
								location.href = getAvatarAssetLink(id, details.name);
								return;
							}

							return new Response(
								JSON.stringify({
									voting: {
										showVotes: false,
										upVotes: 0,
										downVotes: 0,
										canVote: false,
										hasVoted: false,
										voteCount: 0,
										upVotePercent: 0,
									},
									creator: {
										creator: `${details.creator.creatorType?.toLowerCase() ?? "user"}/${details.creator.creatorTargetId}`,
										userId:
											details.creator.creatorType === "User"
												? details.creator.creatorTargetId
												: undefined,
										groupId:
											details.creator.creatorType === "Group"
												? details.creator.creatorTargetId
												: undefined,
										name: details.creator.name,
										verified: true,
									},
									creatorStoreProduct: {
										purchasable: false,
									},
									asset: {
										id: details.assetId,
										name: details.name,
										description: details.description,
										assetTypeId: details.assetTypeId,
										socialLinks: [],
										previewAssets: {
											imagePreviewAssets: [],
											videoPreviewAssets: [],
										},
										createTime: details.created,
										updateTime: details.updated,
									},
								}),
								{
									...res,
									status: 200,
								},
							);
						});
					}
				}
			});
		});
	},
} satisfies Page;

import { resolveOrCreateShareLink } from "src/ts/helpers/requests/services/sharelinks";
import usePromise from "../hooks/usePromise";
import { getAvatarBundleLink, getAvatarMarketplaceLink, getShareLink } from "src/ts/utils/links";
import Loading from "../core/Loading";
import { useEffect } from "preact/hooks";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import { multigetUsersByNames } from "src/ts/helpers/requests/services/users";
import Thumbnail from "../core/Thumbnail";
import { modifyTitle } from "src/ts/helpers/elements";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import { getRobloxCDNUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import Button from "../core/Button";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Page404 from "../core/errors/404";
import { httpClient } from "src/ts/helpers/requests/main";

export type HiddenAvatarBundleContainerProps = {
	bundleId: number;
};

export default function HiddenAvatarBundleContainer({
	bundleId,
}: HiddenAvatarBundleContainerProps) {
	const [details, , error] = usePromise(() => {
		return resolveOrCreateShareLink({
			linkType: "AvatarItemDetails",
			data: {
				itemType: "Bundle",
				itemId: bundleId,
			},
		})
			.then((data) =>
				httpClient.httpRequest<Document>({
					url: getShareLink("AvatarItemDetails", data.linkId, "en"),
					expect: "dom",
					credentials: {
						type: "cookies",
						value: false,
					},
				}),
			)
			.then(async (res) => {
				const name = res.body
					.querySelector<HTMLMetaElement>("meta[name='twitter:description']")
					?.content?.match(
						/Customize your avatar with the (.+) and millions of other items. Mix & match this bundle with other items to create an avatar that is unique to you!/,
					)?.[1];

				// slice(1) to remove the @ at the start
				let creatorName: string | undefined = res.body
					.querySelector<HTMLMetaElement>("meta[name='twitter:creator']")
					?.content?.slice(1);
				const thumbnailUrl = res.body.querySelector<HTMLMetaElement>(
					"meta[name='twitter:image1']",
				)?.content;
				if (creatorName?.length === 0) {
					creatorName = undefined;
				}

				const creator = creatorName
					? (
							await multigetUsersByNames({
								usernames: [creatorName],
								excludeBannedUsers: false,
							})
						)?.[0]
					: undefined;

				if (name && thumbnailUrl) {
					const link = getAvatarBundleLink(bundleId, name, true);
					if (location.pathname !== link) {
						history.replaceState(undefined, "", link);
					}
					modifyTitle(name);

					const thumbnailUrlAsUrl = new URL(thumbnailUrl);

					const isNotThumbnailResizer =
						thumbnailUrlAsUrl.hostname !== getRobloxCDNUrl("tr");

					return {
						name,
						creator,
						thumbnailUrl,
						isModerated: isNotThumbnailResizer,
					};
				}

				location.href = getAvatarMarketplaceLink();
			});
	}, [bundleId]);

	useEffect(() => {
		multigetAvatarItems({
			items: [
				{
					id: bundleId,
					itemType: "Bundle",
				},
			],
		}).then((data) => {
			if (data?.[0]) {
				location.href = getAvatarBundleLink(bundleId, data[0].name);
			}
		});
	}, [bundleId]);

	if (error) return <Page404 />;
	if (!details) {
		return <Loading />;
	}

	return (
		<div className="hidden-avatar-bundle-container">
			<div className="hidden-avatar-bundle-info">
				<div className="hidden-avatar-bundle-preview">
					<Thumbnail
						containerClassName="preview-thumbnail"
						data={{
							state: details.isModerated ? "Blocked" : "Completed",
							imageUrl: details.thumbnailUrl,
						}}
					/>
					<div className="preview-names">
						<h2 className="item-name">{details.name}</h2>
						{details.creator && (
							<div className="blocked-creator-name text">
								{getMessage("hiddenAvatarBundle.by", {
									creator: (
										<AgentMentionContainer
											targetType="User"
											targetId={details.creator.id}
											name={details.creator.name}
											hasVerifiedBadge={details.creator.hasVerifiedBadge}
										/>
									),
								})}
							</div>
						)}
					</div>
				</div>
				<h2 className="hidden-title">
					{getMessage(
						`hiddenAvatarBundle.title.${details.isModerated ? "moderated" : "hidden"}`,
					)}
				</h2>
				<span className="text hidden-preview-text">
					{getMessage(
						`hiddenAvatarBundle.text.${details.isModerated ? "moderated" : "hidden"}`,
					)}
				</span>
				<div className="action-btns">
					<Button
						as="a"
						href={getAvatarMarketplaceLink()}
						className="return-to-marketplace-btn"
					>
						{getMessage("hiddenAvatarBundle.btns.returnToMarketplace")}
					</Button>
				</div>
			</div>
		</div>
	);
}

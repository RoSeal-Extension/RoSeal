import { useEffect, useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { resolveOrCreateShareLink } from "src/ts/helpers/requests/services/sharelinks";
import { success } from "../core/systemFeedback/helpers/globalSystemFeedback";

export type CopyShareLinkButtonProps = {
	type: "User" | "Experience" | "Bundle" | "Asset" | "Look";
	id: number;
};

export default function CopyShareLinkButton({ type, id }: CopyShareLinkButtonProps) {
	const [shareLink, setShareLink] = useState<string>();

	const translationPrefix = useMemo(() => {
		if (type === "User") {
			return "user";
		}
		if (type === "Experience") {
			return "experience";
		}

		return "item";
	}, [type]);

	const params = useMemo(() => {
		if (type === "User") {
			return {
				linkType: "Profile",
			} as const;
		}

		if (type === "Experience") {
			return {
				linkType: "ExperienceDetails",
				data: {
					universeId: id,
				},
			} as const;
		}

		if (type === "Asset" || type === "Bundle" || type === "Look") {
			return {
				linkType: "AvatarItemDetails",
				data: {
					itemType: type,
					itemId: id,
				},
			} as const;
		}
	}, [type, id]);

	useEffect(() => {
		setShareLink(undefined);
	}, [type, id]);

	return (
		<li id="copy-share-link-li" data-share-link-type={type} className="roseal-menu-item">
			<button
				type="button"
				className="copy-share-link-btn"
				onClick={() => {
					document.body.click();
					if (shareLink) {
						navigator.clipboard.writeText(shareLink);
						success(getMessage(`${translationPrefix}.copyShareLink.success`));
					} else if (params) {
						resolveOrCreateShareLink(params).then(({ shortUrl }) => {
							setShareLink(shortUrl);
							navigator.clipboard.writeText(shortUrl);
							success(getMessage(`${translationPrefix}.copyShareLink.success`));
						});
					}
				}}
			>
				{getMessage(`${translationPrefix}.copyShareLink`)}
			</button>
		</li>
	);
}

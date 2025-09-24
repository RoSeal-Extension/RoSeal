import { useState } from "preact/hooks";
import PillToggle from "../../core/PillToggle";
import usePromise from "../../hooks/usePromise";
import { getUserAvatar } from "src/ts/helpers/requests/services/avatar";
import Thumbnail from "../../core/Thumbnail";
import { getAvatarAssetLink } from "src/ts/utils/links";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import classNames from "classnames";

export type UserProfileEquippedEmotesProps = {
	userId: number;
};

type ActiveTab = "emotes" | "assets";

export default function UserProfileEquippedEmotes({ userId }: UserProfileEquippedEmotesProps) {
	const [activeTab, setActiveTab] = useState<ActiveTab>("assets");
	const [emotes] = usePromise(
		() => getUserAvatar({ userId }).then((avatar) => avatar.emotes),
		[userId],
	);

	return (
		emotes &&
		emotes.length > 0 && (
			<>
				<PillToggle
					className="roseal-emotes-assets-toggle"
					items={[
						{ id: "assets", label: getMessage("user.avatar.tabs.assets") },
						{ id: "emotes", label: getMessage("user.avatar.tabs.emotes") },
					]}
					onClick={(id) => setActiveTab(id as ActiveTab)}
					currentId={activeTab}
				/>
				<div
					className={classNames(
						"profile-accoutrements-container roseal-emotes-container",
						{
							hide: activeTab === "assets",
						},
					)}
				>
					<div className="profile-accoutrements-slider">
						<ul className="accoutrement-items-container">
							{emotes.map((emote) => (
								<li className="accoutrement-item" key={emote.assetId}>
									<a href={getAvatarAssetLink(emote.assetId, emote.assetName)}>
										<Thumbnail
											request={{
												type: "Asset",
												targetId: emote.assetId,
												size: "150x150",
											}}
										/>
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>
			</>
		)
	);
}

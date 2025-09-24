import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getBlueskyProfileLink,
	getDiscordInviteLink,
	getGroupProfileLink,
	getMastodonProfileLink,
	getRoSealSiteLink,
	getXProfileLink,
} from "src/ts/utils/links";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import DataManagement from "../other/DataManagement";
import LanguageSwitcher from "../other/LanguageSwitcher";
import I18nOverrides from "../other/I18nOverrides";
import {
	BLUESKY_PROFILE_HANDLE,
	DISCORD_INVITE_CODE,
	MASTODON_PROFILE_HANDLE,
	ROBLOX_GROUP_ID,
	X_PROFILE_HANDLE,
} from "src/ts/constants/rosealSettings";

export default function ManagementTab() {
	const [authenticatedUser] = useAuthenticatedUser();

	return (
		<div className="management-sections-container">
			<div className="section support-links-section">
				<p>{getMessage("settings.management.support.message")}</p>
				<ul className="support-methods-list">
					{authenticatedUser?.isUnder13 === false && (
						<>
							<li>
								<a
									href={getDiscordInviteLink(DISCORD_INVITE_CODE)}
									className="text-link"
								>
									{getMessage("settings.management.support.links.discord")}
								</a>
							</li>
							<li>
								<a
									href={getBlueskyProfileLink(BLUESKY_PROFILE_HANDLE)}
									className="text-link"
								>
									{getMessage("settings.management.support.links.bluesky")}
								</a>
							</li>
							<li>
								<a href={getXProfileLink(X_PROFILE_HANDLE)} className="text-link">
									{getMessage("settings.management.support.links.x")}
								</a>
							</li>
							<li>
								<a
									href={getMastodonProfileLink(MASTODON_PROFILE_HANDLE)}
									className="text-link"
								>
									{getMessage("settings.management.support.links.mastodon")}
								</a>
							</li>
						</>
					)}
					<li>
						<a href={getRoSealSiteLink()} className="text-link">
							{getMessage("settings.management.support.links.website")}
						</a>
					</li>
					<li>
						<a href={getGroupProfileLink(ROBLOX_GROUP_ID)} className="text-link">
							{getMessage("settings.management.support.links.robloxGroup")}
						</a>
					</li>
				</ul>
			</div>
			<div className="section roseal-language-section">
				<div className="container-header">
					<h2>{getMessage("settings.management.languageSwitcher.title")}</h2>
				</div>
				<LanguageSwitcher />
			</div>
			<DataManagement />
			<I18nOverrides />
		</div>
	);
}

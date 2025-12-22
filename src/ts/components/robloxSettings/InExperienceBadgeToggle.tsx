import {
	getInExperienceProfileSettings,
	updateInExperienceProfileSettings,
} from "src/ts/helpers/requests/services/users";
import Toggle from "../core/Toggle";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function InExperienceBadgeToggle() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [settings, , , refetchSettings] = usePromise(
		() => getInExperienceProfileSettings(),
		[],
		false,
	);
	if (!authenticatedUser?.hasVerifiedBadge || !settings?.isSettingsEnabled) return null;

	const onToggle = () =>
		updateInExperienceProfileSettings({
			userProfileSettings: {
				isInExperienceNameEnabled: !settings.userProfileSettings.isInExperienceNameEnabled,
			},
		}).finally(refetchSettings);

	return (
		<div class="section-content">
			<div class="inline-user-input">
				<div class="label font-body">
					{getMessage("robloxSettings.privacy.inExperienceBadgeVisibility.title")}
				</div>
				<div>
					<div id="share-activity-updates-toggle" class="parental-consent-toggle">
						<Toggle
							isOn={settings.userProfileSettings.isInExperienceNameEnabled}
							onToggle={onToggle}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

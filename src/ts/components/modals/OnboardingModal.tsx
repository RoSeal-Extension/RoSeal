import { getMessage } from "src/ts/helpers/i18n/getMessage";
import SimpleModal from "../core/modal/SimpleModal";
import { useState } from "preact/hooks";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { getRoSealChangelogLink, getRoSealSettingsLink } from "src/ts/utils/links";
import usePromise from "../hooks/usePromise";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import Icon from "../core/Icon";

export type OnboardingModalProps = {
	type: "install" | "update";
	accept: () => Promise<void>;
};

export default function OnboardingModal({ type, accept }: OnboardingModalProps) {
	const [alertsAndOptions] = usePromise(() => getLangNamespace("Common.AlertsAndOptions"), []);
	const [commonUIFeatures] = usePromise(() => getLangNamespace("CommonUI.Features"), []);
	const [show, setShow] = useState(true);

	return (
		<SimpleModal
			id="roseal-onboarding-modal"
			size="sm"
			title={getMessage(`onboardingModal.title.${type}`, {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			closeable={false}
			centerBody
			show={show}
			buttons={[
				{
					type: "neutral",
					text: getMessage("onboardingModal.neutral"),
					onClick: () => {
						accept().finally(() => globalThis.open(getRoSealSettingsLink()));
					},
				},
				{
					type: "action",
					text: getMessage("onboardingModal.action"),
					onClick: () => {
						accept().finally(() => setShow(false));
					},
				},
			]}
		>
			{getMessage(`onboardingModal.body.${type}`, {
				changelogLink: (contents: string) => (
					<a
						href={getRoSealChangelogLink("2.0.0")}
						className="text-link"
						target="_blank"
						rel="noreferrer"
					>
						{contents}
					</a>
				),
				image: (
					<div className="onboarding-mockup">
						<ul className="top-navigation-mockup">
							<li>
								<Icon name="common-notification-bell" />
							</li>
							<li>
								<Icon name="robux-28x28" />
							</li>
							<li>
								<Icon name="nav-settings" />
								<div role="tooltip" className="popover bottom">
									<div className="arrow" />
									<div className="popover-content">
										<ul className="dropdown-menu">
											<li>
												<button type="button">
													{alertsAndOptions?.["Label.sSettings"]}
												</button>
											</li>
											<li className="active">
												<button type="button">
													{getMessage("rosealSettings", {
														sealEmoji: SEAL_EMOJI_COMPONENT,
													})}
												</button>
											</li>
											<li>
												<button type="button">
													{alertsAndOptions?.["Label.sQuickLogin"]}
												</button>
											</li>
											<li>
												<button type="button">
													{commonUIFeatures?.["Label.HelpAndSafety"] ??
														alertsAndOptions?.["Label.sHelp"]}
												</button>
											</li>
											<li>
												<button type="button">
													{alertsAndOptions?.["Label.sSwitchAccount"]}
												</button>
											</li>
											<li>
												<button type="button">
													{alertsAndOptions?.["Label.sLogout"]}
												</button>
											</li>
										</ul>
									</div>
								</div>
							</li>
						</ul>
					</div>
				),
				webStoreLink: (contents: string) => (
					<a
						className="text-link"
						href={import.meta.env.WEB_STORE_LISTING_LINK}
						target="_blank"
						rel="noreferrer"
					>
						{contents}
					</a>
				),
				target: import.meta.env.TARGET,
			})}
		</SimpleModal>
	);
}

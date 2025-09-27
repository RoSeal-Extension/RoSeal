import { type Signal, signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { useMemo } from "preact/hooks";
//import SubscriptionTab from "./tabs/Subscription.tsx";
import { ACCOUNT_TRACKING_PREVENTION_FEATURE_ID } from "src/ts/constants/accountTrackingPrevention.ts";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact.tsx";
import { sections } from "../../helpers/features/featuresData.ts";
import { getMessage, hasMessage } from "../../helpers/i18n/getMessage.ts";
import Button from "../core/Button.tsx";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import useHybridTabNavigation, { type AnyTab } from "../hooks/useHybridTabNavigation.tsx";
import FeatureSection, { shouldFeaturesSectionDisplay } from "./features/FeaturesSection.tsx";
import AccountTrackingPreventionTab from "./tabs/AccountTrackingPreventionTab.tsx";
import AllowedItemsTab from "./tabs/AllowedItems.tsx";
import BlockedItemsTab from "./tabs/BlockedItems.tsx";
import ManagementTab from "./tabs/Management.tsx";
import RobloxExperimentsTab from "./tabs/RobloxExperiments.tsx";
import SettingsAlerts from "./other/SettingsAlerts.tsx";

function getInitialTabs(
	isBlockingItemsEnabled: Signal<boolean | undefined>,
	isRobloxExperimentsEnabled: Signal<boolean | undefined>,
	isAccountTrackingPreventionEnabled: Signal<boolean | undefined>,
): AnyTab[] {
	const search = new URLSearchParams(location.search);
	const keyword = signal(search.get("rosealSearch") || "");

	keyword.subscribe(() => {
		const url = new URL(location.href);
		if (keyword.value) {
			url.searchParams.set("rosealSearch", keyword.value);
		} else {
			url.searchParams.delete("rosealSearch");
		}

		history.replaceState(null, "", url.toString());
	});

	const tabs: AnyTab[] = [
		{
			id: "management",
			value: "management",
			label: getMessage("settings.tabs.management"),
			content: <ManagementTab />,
		},
		/*
		UNUSED:
		{
			id: "subscription",
			value: "subscription",
			label: getMessage("settings.tabs.subscription"),
			content: <SubscriptionTab />,
		},*/
		{
			id: "features",
			value: "features",
			label: getMessage("settings.tabs.features"),
			items: sections.map((section) => {
				const sectionLabelKey = `featureSections.${section.id}.title`;

				return {
					id: `features_${section.id}`,
					value: `features_${section.id}`,
					label: hasMessage(sectionLabelKey) ? getMessage(sectionLabelKey) : section.id,
					content: (
						<FeatureSection key={section.id} section={section} keyword={keyword} />
					),
					isVisible: () => shouldFeaturesSectionDisplay(section, keyword.value),
				};
			}),
			searchDetail: {
				label: getMessage("settings.features.search"),
				signal: keyword,
			},
			asSection: true,
		},
		{
			id: "blocked_items",
			value: "blocked_items",
			label: getMessage("settings.tabs.blockedItems"),
			items: [
				{
					id: "blocked_items_blocked",
					value: "blocked_items_blocked",
					label: getMessage("settings.tabs.blockedItems.blocked"),
					content: <BlockedItemsTab />,
				},
				{
					id: "blocked_items_allowed",
					value: "blocked_items_allowed",
					label: getMessage("settings.tabs.blockedItems.allowed"),
					content: <AllowedItemsTab />,
				},
			],
			isVisible: () => isBlockingItemsEnabled.value === true,
		},
		{
			id: "account_tracking_prevention",
			value: "account_tracking_prevention",
			label: getMessage("settings.tabs.accountTrackingPrevention"),
			content: <AccountTrackingPreventionTab />,
			isVisible: () => isAccountTrackingPreventionEnabled.value === true,
		},
		{
			id: "roblox_experiments",
			value: "roblox_experiments",
			label: getMessage("settings.tabs.robloxExperiments"),
			content: <RobloxExperimentsTab />,
			isVisible: () => isRobloxExperimentsEnabled.value === true,
		},
	];

	return tabs;
}

export type RoSealSettingsProps = {
	initialActiveTabId?: string;
	returnToRoblox: () => void;
	children?: ComponentChildren;
};

export default function RoSealSettings({
	initialActiveTabId,
	returnToRoblox,
}: RoSealSettingsProps) {
	const [, , isBlockingItemsEnabled] = useFeatureValue("blockedItems", false);
	const [, , isRobloxExperimentsEnabled] = useFeatureValue("overrideRobloxExperiments", false);
	const [, , isAccountTrackingPreventionEnabled] = useFeatureValue(
		ACCOUNT_TRACKING_PREVENTION_FEATURE_ID,
		false,
	);

	const tabs = useMemo<AnyTab[]>(
		() =>
			getInitialTabs(
				isBlockingItemsEnabled,
				isRobloxExperimentsEnabled,
				isAccountTrackingPreventionEnabled,
			),
		[],
	);

	const [mobileNav, desktopNav, content] = useHybridTabNavigation({
		initialActiveTabId,
		tabs,
		switchTab: (tabId) => {
			if (!tabId) return;

			const params = new URLSearchParams(location.search);

			params.set("roseal", tabId);
			history.replaceState(undefined, "", `?${params.toString()}`);
		},
	});

	return (
		<div className="row page-content" id="roseal-settings-container">
			<div className="roseal-settings">
				<Button type="secondary" size="md" onClick={returnToRoblox}>
					{getMessage("settings.return")}
				</Button>
				<h1>
					{getMessage("rosealSettings", {
						sealEmoji: SEAL_EMOJI_COMPONENT,
					})}
				</h1>
				<div id="settings-container">
					<SettingsAlerts />
					{mobileNav}
					<div className="settings-left-navigation">
						{desktopNav}
						{content}
					</div>
				</div>
			</div>
		</div>
	);
}

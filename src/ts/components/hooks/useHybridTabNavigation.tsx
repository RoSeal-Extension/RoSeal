import type { Signal } from "@preact/signals";
import { type ComponentChild, Fragment } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import BreadcrumContainer, { Breadcrumb } from "../core/BreadcrumContainer.tsx";
import Dropdown from "../core/Dropdown.tsx";
import Icon from "../core/Icon.tsx";
import TextInput from "../core/TextInput.tsx";
import VerticalMenu, {
	Option,
	OptionContent,
	OptionSecondaryContainer,
} from "../core/verticalMenu/VerticalMenu.tsx";

export type Tab = {
	id: string;
	label: string;
	value: string;
	isVisible?: () => boolean;
	content: ComponentChild;
};

export type AnyTab =
	| {
			id: string;
			label: string;
			items: Tab[];
			searchDetail?: {
				label: string;
				signal: Signal<string>;
			};
			asSection?: boolean;
	  }
	| Tab;

export type UseHybridTabNavigationProps = {
	tabs: AnyTab[];
	initialActiveTabId?: string;
	switchTab?: (tabId?: string) => void;
};

export default function useHybridTabNavigation({
	initialActiveTabId,
	tabs,
	switchTab,
}: UseHybridTabNavigationProps): [
	(ComponentChild | undefined | "")[],
	ComponentChild,
	ComponentChild,
	(tabId?: string) => void,
] {
	const [currentTabId, setCurrentTabId] = useState<string | undefined>();
	const updateCurrentTabId = (id?: string) => {
		switchTab?.(id);
		setCurrentTabId(id);
	};

	const allTabs: (AnyTab & {
		parentTabId?: string;
	})[] = tabs.flatMap((tab) =>
		// @ts-expect-error: Same as .map().flat(), but does not typeguard(?)
		"items" in tab
			? [
					tab,
					...tab.items.map((item) => ({
						...item,
						parentTabId: tab.id,
					})),
				]
			: tab,
	);

	useEffect(() => {
		if (initialActiveTabId) {
			const tab = tabs.find((tab) => tab.id === initialActiveTabId);

			if (tab && "items" in tab) {
				return updateCurrentTabId(tab.items[0].id);
			}
		}

		updateCurrentTabId(initialActiveTabId || allTabs.find((item) => "content" in item)?.id);
	}, [initialActiveTabId]);

	const currentTab = useMemo(
		() => allTabs.find((tab) => tab.id === currentTabId),
		[tabs.length, currentTabId],
	);
	const parentTab = useMemo(
		() => allTabs.find((tab) => tab.id === currentTab?.parentTabId),
		[tabs.length, currentTabId],
	);
	const isContentVisible =
		currentTab && "content" in currentTab && (!currentTab.isVisible || currentTab.isVisible());

	return [
		[
			<Dropdown
				key="mobile-navigation"
				className="mobile-navigation-dropdown"
				selectionItems={tabs}
				selectedItemValue={currentTab?.id}
				onSelect={updateCurrentTabId}
			/>,
		],
		<VerticalMenu key="desktop-navigation" className="transparent-background-menu">
			{tabs.map((item) => {
				if ("asSection" in item && item.asSection) {
					return (
						<div className="vertical-menu-section" key={item.id}>
							{/*
							<div className="vertical-menu-divider border-bottom">
								<span className="text">{item.label}</span>
					</div>*/}

							<div className="section-list">
								{item.searchDetail && (
									<div className="input-group with-search-bar">
										<TextInput
											placeholder={item.searchDetail.label}
											value={item.searchDetail.signal.value}
											onType={(value) => {
												item.searchDetail!.signal.value = value;
											}}
										/>
										<div className="input-group-btn">
											<button className="input-addon-btn" type="button">
												<Icon name="search" />
											</button>
										</div>
									</div>
								)}
								{item.items?.map(
									(item2) =>
										(!item.searchDetail || item2.isVisible?.()) && (
											<Option
												key={item2.id}
												isActive={currentTab?.id === item2.id}
											>
												<OptionContent
													title={item2.label}
													active={currentTab?.id === item2.id}
													onClick={() => updateCurrentTabId(item2.id)}
												/>
											</Option>
										),
								)}
							</div>
						</div>
					);
				}

				if ("isVisible" in item && item.isVisible && !item.isVisible()) {
					return null;
				}
				return (
					<Fragment key={item.id}>
						<Option isActive={currentTab?.id === item.id}>
							<OptionContent
								title={item.label}
								className="font-caption-header"
								active={currentTab?.id === item.id}
								hasSubtabs={"items" in item && !item.asSection}
								subtabActive={currentTab?.parentTabId === item.id}
								onClick={() => {
									if ("items" in item) {
										updateCurrentTabId(item.items[0].id);
									} else {
										updateCurrentTabId(item.id);
									}
								}}
							/>
						</Option>
						{"items" in item &&
							currentTab?.parentTabId === item.id &&
							!item.asSection && (
								<OptionSecondaryContainer>
									{item.items?.map((item2) => (
										<Option
											key={item2.id}
											isActive={currentTab?.id === item2.id}
										>
											<OptionContent
												title={item2.label}
												active={currentTab?.id === item2.id}
												onClick={() => updateCurrentTabId(item2.id)}
											/>
										</Option>
									))}
								</OptionSecondaryContainer>
							)}
					</Fragment>
				);
			})}
		</VerticalMenu>,
		<div key="settings-content" className="tab-content rbx-tab-content">
			<div role="tabpanel" className="tab-pane active">
				{isContentVisible && (
					<div className="section">
						<div className="container-header hidden-xs">
							<h3>
								<BreadcrumContainer>
									{parentTab && <Breadcrumb>{parentTab.label}</Breadcrumb>}
									<Breadcrumb>{currentTab?.label}</Breadcrumb>
								</BreadcrumContainer>
							</h3>
						</div>
						{currentTab && "content" in currentTab && currentTab.content}
					</div>
				)}
			</div>
		</div>,
		setCurrentTabId,
	];
}

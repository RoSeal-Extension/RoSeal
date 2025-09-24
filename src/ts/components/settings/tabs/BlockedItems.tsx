import {
	BLOCKED_ITEMS_STORAGE_KEY,
	type BlockedItemsStorage,
	DEFAULT_BLOCKED_ITEMS_STORAGE,
} from "src/ts/constants/misc";
import useStorage from "../../hooks/useStorage";
import usePromise from "../../hooks/usePromise";
import { multigetGroupsByIds } from "src/ts/helpers/requests/services/groups";
import {
	profileProcessor,
	type UserProfileRequest,
} from "src/ts/helpers/processors/profileProcessor";
import { multigetDevelopUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import Loading from "../../core/Loading";
import {
	getAvatarAssetLink,
	getAvatarBundleLink,
	getCreatorProfileLink,
	getExperienceLink,
	getGroupProfileLink,
	getUserProfileLink,
} from "src/ts/utils/links";
import Button from "../../core/Button";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import TextInput from "../../core/TextInput";
import { useState } from "preact/hooks";
import type { ComponentChildren, JSX } from "preact";
import { asLocaleLowerCase, asLocaleString } from "src/ts/helpers/i18n/intlFormats";

export type BlockedListProps<T> = {
	items?: T[] | null;
	count: number;
	limit?: number;
	descriptionOff?: string;
	children?: ComponentChildren;
	component: (item: T) => JSX.Element;
};

export type LimitTextProps = {
	count: number;
	limit: number;
};

export function LimitText({ count, limit }: LimitTextProps) {
	return (
		<div className="blocked-list-count text small">
			{getMessage("blockedItems.limitText", {
				count: asLocaleString(count),
				limit: asLocaleString(limit),
			})}
		</div>
	);
}

export function BlockedList<T>({
	items,
	count,
	descriptionOff,
	children,
	component,
	limit,
}: BlockedListProps<T>) {
	return (
		<>
			{limit !== undefined && <LimitText count={count} limit={limit} />}
			<div className="section-content blocked-list-container">
				{children}
				{count === 0 ? (
					descriptionOff && <div className="blocked-list-off text">{descriptionOff}</div>
				) : (
					<>
						{!items && <Loading />}
						<ul className="section-list blocked-list">{items?.map(component)}</ul>
					</>
				)}
			</div>
		</>
	);
}

export type HalfBlockedListSectionProps = {
	title: string;
	children: ComponentChildren;
	limit?: number;
	count?: number;
};

export function HalfBlockedListSection({
	title,
	children,
	limit,
	count,
}: HalfBlockedListSectionProps) {
	return (
		<div className="section blocked-list-section">
			<div className="container-header">
				<span className="font-bold">{title}</span>
				{limit !== undefined && count !== undefined && (
					<LimitText count={count} limit={limit} />
				)}
			</div>
			{children}
		</div>
	);
}

export type BlockedKeywordsSectionProps = {
	title: string;
	descriptionOff?: string;
	keywords: string[];
	setKeywords: (keywords: string[]) => void;
};

export function BlockedKeywordsSection({
	title,
	descriptionOff,
	keywords,
	setKeywords,
}: BlockedKeywordsSectionProps) {
	const [inputValue, setInputValue] = useState("");

	const submitKeyword = () => {
		setKeywords([...keywords.filter((item) => item !== inputValue), inputValue]);
		setInputValue("");
	};

	return (
		<HalfBlockedListSection title={title} count={keywords.length}>
			<BlockedList
				descriptionOff={descriptionOff}
				count={keywords.length}
				items={keywords}
				component={(keyword) => (
					<li key={keyword} className="blocked-item">
						<div className="blocked-item-info text-overflow">
							<span className="blocked-item-name text-overflow">{keyword}</span>
						</div>
						<Button
							size="xs"
							className="unblock-btn"
							onClick={() => {
								setKeywords(keywords.filter((item) => item !== keyword));
							}}
						>
							{getMessage("blockedItems.unblock")}
						</Button>
					</li>
				)}
			>
				<div className="add-keyword-section">
					<TextInput
						className="add-keyword-input"
						value={inputValue}
						onType={(value) => {
							setInputValue(asLocaleLowerCase(value));
						}}
						onEnter={submitKeyword}
						blurOnEnter={false}
					/>
					<Button
						size="xs"
						onClick={submitKeyword}
						className="add-keyword-btn"
						disabled={!inputValue}
					>
						{getMessage("blockedItems.addKeyword")}
					</Button>
				</div>
			</BlockedList>
		</HalfBlockedListSection>
	);
}

export default function BlockedItemsTab() {
	const [blockedItemsData, setBlockedItemsData] = useStorage<BlockedItemsStorage>(
		BLOCKED_ITEMS_STORAGE_KEY,
		DEFAULT_BLOCKED_ITEMS_STORAGE,
	);
	const [creators] = usePromise(
		() => {
			const groupIds: number[] = [];
			const userRequests: (UserProfileRequest & {
				requestId: number;
			})[] = [];
			for (const creator of blockedItemsData.creators) {
				if (creator.type === "Group") groupIds.push(creator.id);
				else
					userRequests.push({
						requestId: creator.id,
						userId: creator.id,
					});
			}

			return Promise.all([
				groupIds.length ? multigetGroupsByIds({ groupIds }) : undefined,
				userRequests.length ? profileProcessor.requestBatch(userRequests) : undefined,
			]);
		},
		[blockedItemsData.creators],
		false,
	);
	const [universes] = usePromise(
		() =>
			blockedItemsData.experiences.ids.length
				? multigetDevelopUniversesByIds({
						ids: blockedItemsData.experiences.ids,
					})
				: undefined,
		[blockedItemsData.experiences],
		false,
	);
	const [avatarItems] = usePromise(
		() =>
			blockedItemsData.items.items.length
				? multigetAvatarItems({
						items: blockedItemsData.items.items.map((item) => ({
							id: item.id,
							itemType: item.type,
						})),
					})
				: undefined,
		[blockedItemsData.items.items],
		false,
	);

	return (
		<div className="blocked-items-section-container">
			<div className="section blocked-items-section" id="blocked-experiences">
				<div className="container-header">
					<h2>{getMessage("blockedItems.experiences.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("blockedItems.experiences.description")}
					</p>
					<BlockedList
						descriptionOff={getMessage("blockedItems.experiences.descriptionOff")}
						count={blockedItemsData.experiences.ids.length}
						items={universes}
						component={(universe) => (
							<li key={universe.id} className="blocked-item">
								<div className="blocked-item-info text-overflow">
									<a
										className="blocked-item-name text-link text-overflow"
										href={getExperienceLink(
											universe.rootPlaceId,
											universe.name,
										)}
									>
										{universe.name}
									</a>
									<span className="blocked-item-creator text-overflow text small">
										{getMessage("item.byWith@", {
											creatorType: universe.creatorType,
											creatorName: universe.creatorName,
											creatorLink: (contents: string) => (
												<a
													href={getCreatorProfileLink(
														universe.creatorTargetId,
														universe.creatorType,
														universe.creatorName,
													)}
													className="blocked-item-creator-name text-overflow text-link-secondary"
												>
													{contents}
												</a>
											),
										})}
									</span>
								</div>
								<Button
									size="xs"
									className="unblock-btn"
									onClick={() => {
										setBlockedItemsData({
											...blockedItemsData,
											experiences: {
												...blockedItemsData.experiences,
												ids: blockedItemsData.experiences.ids.filter(
													(id) => id !== universe.id,
												),
											},
										});
									}}
								>
									{getMessage("blockedItems.unblock")}
								</Button>
							</li>
						)}
					/>
				</div>
				<div className="section keyword-block-section">
					<div className="container-header">
						<h3>{getMessage("blockedItems.experiences.keywords.title")}</h3>
					</div>
					<p className="section-description">
						{getMessage("blockedItems.experiences.keywords.description")}
					</p>
					<br />
					<p className="performance-notice">
						{getMessage("blockedItems.experiences.keywords.performanceNotice")}
					</p>
					<div className="blocked-list-containers">
						<BlockedKeywordsSection
							title={getMessage("blockedItems.experiences.keywords.nameKeywords")}
							keywords={blockedItemsData.experiences.names}
							setKeywords={(keywords) => {
								setBlockedItemsData({
									...blockedItemsData,
									experiences: {
										...blockedItemsData.experiences,
										names: keywords,
									},
								});
							}}
						/>
						<BlockedKeywordsSection
							title={getMessage(
								"blockedItems.experiences.keywords.descriptionKeywords",
							)}
							keywords={blockedItemsData.experiences.descriptions}
							setKeywords={(keywords) => {
								setBlockedItemsData({
									...blockedItemsData,
									experiences: {
										...blockedItemsData.experiences,
										descriptions: keywords,
									},
								});
							}}
						/>
					</div>
				</div>
			</div>
			<div className="section blocked-items-section" id="blocked-items">
				<div className="container-header">
					<h2>{getMessage("blockedItems.avatarItems.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("blockedItems.avatarItems.description")}
					</p>
					<BlockedList
						descriptionOff={getMessage("blockedItems.avatarItems.descriptionOff")}
						count={blockedItemsData.items.items.length}
						items={avatarItems}
						component={(item) => (
							<li
								key={`${item.itemType}${item.id}`}
								className="blocked-item has-item-type"
							>
								<div className="blocked-item-info text-overflow">
									<span className="blocked-item-type text xsmall">
										{getMessage(`itemTypes.${item.itemType}`)}
									</span>
									<a
										className="blocked-item-name text-link text-overflow"
										href={
											item.itemType === "Bundle"
												? getAvatarBundleLink(item.id, item.name)
												: getAvatarAssetLink(item.id, item.name)
										}
									>
										{item.name}
									</a>
									<span className="blocked-item-creator text-overflow text small">
										{getMessage("item.byWith@", {
											creatorType: item.creatorType,
											creatorName: item.creatorName,
											creatorLink: (contents: string) => (
												<a
													href={getCreatorProfileLink(
														item.creatorTargetId,
														item.creatorType,
														item.creatorName,
													)}
													className="blocked-item-creator-name text-overflow text-link-secondary"
												>
													{contents}
												</a>
											),
										})}
									</span>
								</div>
								<Button
									size="xs"
									className="unblock-btn"
									onClick={() => {
										setBlockedItemsData({
											...blockedItemsData,
											items: {
												...blockedItemsData.items,
												items: blockedItemsData.items.items.filter(
													(item2) =>
														item.id !== item2.id ||
														item.itemType !== item2.type,
												),
											},
										});
									}}
								>
									{getMessage("blockedItems.unblock")}
								</Button>
							</li>
						)}
					/>
				</div>
				<div className="section keyword-block-section">
					<div className="container-header">
						<h3>{getMessage("blockedItems.avatarItems.keywords.title")}</h3>
					</div>
					<p className="section-description">
						{getMessage("blockedItems.avatarItems.keywords.description")}
					</p>
					<div className="blocked-list-containers">
						<BlockedKeywordsSection
							title={getMessage("blockedItems.avatarItems.keywords.nameKeywords")}
							keywords={blockedItemsData.items.names}
							setKeywords={(keywords) => {
								setBlockedItemsData({
									...blockedItemsData,
									items: {
										...blockedItemsData.items,
										names: keywords,
									},
								});
							}}
						/>
						<BlockedKeywordsSection
							title={getMessage(
								"blockedItems.avatarItems.keywords.descriptionKeywords",
							)}
							keywords={blockedItemsData.items.descriptions}
							setKeywords={(keywords) => {
								setBlockedItemsData({
									...blockedItemsData,
									items: {
										...blockedItemsData.items,
										descriptions: keywords,
									},
								});
							}}
						/>
					</div>
				</div>
			</div>
			<div className="section blocked-items-section" id="blocked-creators">
				<div className="container-header">
					<h2>{getMessage("blockedItems.creators.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("blockedItems.creators.description")}
					</p>
					<br />
					<p className="performance-notice">
						{getMessage("blockedItems.creators.performanceNotice")}
					</p>
					<div className="blocked-list-containers">
						<HalfBlockedListSection
							title={getMessage("blockedItems.creators.groups.title")}
						>
							<BlockedList
								descriptionOff={getMessage(
									"blockedItems.creators.groups.descriptionOff",
								)}
								count={
									blockedItemsData.creators.filter(
										(creator) => creator.type === "Group",
									).length
								}
								items={creators?.[0]}
								component={(creator) => (
									<li key={creator.id} className="blocked-item">
										<div className="blocked-item-info text-overflow">
											<a
												className="blocked-item-name text-link text-overflow"
												href={getGroupProfileLink(creator.id, creator.name)}
											>
												{creator.name}
											</a>
										</div>
										<Button
											size="xs"
											className="unblock-btn"
											onClick={() => {
												setBlockedItemsData({
													...blockedItemsData,
													creators: blockedItemsData.creators.filter(
														(creator2) =>
															creator2.id !== creator.id ||
															creator2.type !== "Group",
													),
												});
											}}
										>
											{getMessage("blockedItems.unblock")}
										</Button>
									</li>
								)}
							/>
						</HalfBlockedListSection>
						<HalfBlockedListSection
							title={getMessage("blockedItems.creators.users.title")}
						>
							<BlockedList
								descriptionOff={getMessage(
									"blockedItems.creators.users.descriptionOff",
								)}
								count={
									blockedItemsData.creators.filter(
										(creator) => creator.type === "User",
									).length
								}
								items={creators?.[1]}
								component={(creator) => (
									<li key={creator.userId} className="blocked-item">
										<div className="blocked-item-info text-overflow">
											<a
												className="blocked-item-name text-link text-overflow"
												href={getUserProfileLink(creator.userId)}
											>
												{creator.names.username}
											</a>
										</div>
										<Button
											size="xs"
											className="unblock-btn"
											onClick={() => {
												setBlockedItemsData({
													...blockedItemsData,
													creators: blockedItemsData.creators.filter(
														(creator2) =>
															creator2.id !== creator.userId ||
															creator2.type !== "User",
													),
												});
											}}
										>
											{getMessage("blockedItems.unblock")}
										</Button>
									</li>
								)}
							/>
						</HalfBlockedListSection>
					</div>
				</div>
			</div>
		</div>
	);
}

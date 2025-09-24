import {
	ALLOWED_ITEMS_STORAGE_KEY,
	type AllowedItemsStorage,
	DEFAULT_ALLOWED_ITEMS_STORAGE,
} from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	profileProcessor,
	type UserProfileRequest,
} from "src/ts/helpers/processors/profileProcessor";
import { multigetGroupsByIds } from "src/ts/helpers/requests/services/groups";
import { multigetAvatarItems } from "src/ts/helpers/requests/services/marketplace";
import { multigetDevelopUniversesByIds } from "src/ts/helpers/requests/services/universes";
import {
	getAvatarAssetLink,
	getAvatarBundleLink,
	getCreatorProfileLink,
	getExperienceLink,
	getGroupProfileLink,
	getUserProfileLink,
} from "src/ts/utils/links";
import Button from "../../core/Button";
import usePromise from "../../hooks/usePromise";
import useStorage from "../../hooks/useStorage";
import { BlockedList, HalfBlockedListSection } from "./BlockedItems";

export default function AllowedItemsTab() {
	const [allowedItemsData, setAllowedItemsData] = useStorage<AllowedItemsStorage>(
		ALLOWED_ITEMS_STORAGE_KEY,
		DEFAULT_ALLOWED_ITEMS_STORAGE,
	);
	const [creators] = usePromise(
		() => {
			const groupIds: number[] = [];
			const userRequests: (UserProfileRequest & {
				requestId: number;
			})[] = [];
			for (const creator of allowedItemsData.creators) {
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
		[allowedItemsData.creators],
		false,
	);
	const [universes] = usePromise(
		() =>
			allowedItemsData.experiences.ids.length
				? multigetDevelopUniversesByIds({
						ids: allowedItemsData.experiences.ids,
					})
				: undefined,
		[allowedItemsData.experiences],
		false,
	);
	const [avatarItems] = usePromise(
		() =>
			allowedItemsData.items.items.length
				? multigetAvatarItems({
						items: allowedItemsData.items.items.map((item) => ({
							id: item.id,
							itemType: item.type,
						})),
					})
				: undefined,
		[allowedItemsData.items.items],
		false,
	);

	return (
		<div className="blocked-items-section-container">
			<div className="section blocked-items-section" id="allowed-experiences">
				<div className="container-header">
					<h2>{getMessage("allowedItems.experiences.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("allowedItems.experiences.description")}
					</p>
					<BlockedList
						descriptionOff={getMessage("allowedItems.experiences.descriptionOff")}
						count={allowedItemsData.experiences.ids.length}
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
										setAllowedItemsData({
											...allowedItemsData,
											experiences: {
												...allowedItemsData.experiences,
												ids: allowedItemsData.experiences.ids.filter(
													(id) => id !== universe.id,
												),
											},
										});
									}}
								>
									{getMessage("allowedItems.remove")}
								</Button>
							</li>
						)}
					/>
				</div>
			</div>
			<div className="section blocked-items-section" id="allowed-items">
				<div className="container-header">
					<h2>{getMessage("allowedItems.avatarItems.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("allowedItems.avatarItems.description")}
					</p>
					<BlockedList
						descriptionOff={getMessage("allowedItems.avatarItems.descriptionOff")}
						count={allowedItemsData.items.items.length}
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
										setAllowedItemsData({
											...allowedItemsData,
											items: {
												...allowedItemsData.items,
												items: allowedItemsData.items.items.filter(
													(item2) =>
														item.id !== item2.id ||
														item.itemType !== item2.type,
												),
											},
										});
									}}
								>
									{getMessage("allowedItems.remove")}
								</Button>
							</li>
						)}
					/>
				</div>
			</div>
			<div className="section blocked-items-section" id="allowed-creators">
				<div className="container-header">
					<h2>{getMessage("allowedItems.creators.title")}</h2>
				</div>
				<div className="section explicit-block-section">
					<p className="section-description">
						{getMessage("allowedItems.creators.description")}
					</p>
					<br />
					<p className="performance-notice">
						{getMessage("allowedItems.creators.performanceNotice")}
					</p>
					<div className="blocked-list-containers">
						<HalfBlockedListSection
							title={getMessage("allowedItems.creators.groups.title")}
						>
							<BlockedList
								descriptionOff={getMessage(
									"allowedItems.creators.groups.descriptionOff",
								)}
								count={
									allowedItemsData.creators.filter(
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
												setAllowedItemsData({
													...allowedItemsData,
													creators: allowedItemsData.creators.filter(
														(creator2) =>
															creator2.id !== creator.id ||
															creator2.type !== "Group",
													),
												});
											}}
										>
											{getMessage("allowedItems.remove")}
										</Button>
									</li>
								)}
							/>
						</HalfBlockedListSection>
						<HalfBlockedListSection
							title={getMessage("allowedItems.creators.users.title")}
						>
							<BlockedList
								descriptionOff={getMessage(
									"allowedItems.creators.users.descriptionOff",
								)}
								count={
									allowedItemsData.creators.filter(
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
												setAllowedItemsData({
													...allowedItemsData,
													creators: allowedItemsData.creators.filter(
														(creator2) =>
															creator2.id !== creator.userId ||
															creator2.type !== "User",
													),
												});
											}}
										>
											{getMessage("allowedItems.remove")}
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

import { useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import {
	getPassProductById,
	listUniversePasses,
	type UniversePassDetails,
} from "src/ts/helpers/requests/services/passes";
import {
	getRobloxSharedExperiencePasses,
	type RobloxSharedExperiencePass,
} from "src/ts/helpers/requests/services/roseal";
import type { RequestedUser } from "src/ts/helpers/requests/services/users";
import { getManagePassesLink } from "src/ts/utils/links";
import CheckboxField from "../../core/CheckboxField";
import Icon from "../../core/Icon";
import AgentMentionContainer from "../../core/items/AgentMentionContainer";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import UserLookup from "../../core/UserLookup";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import Pass from "./Pass";

export type PassesProps = {
	universeId: number;
	canManageUniverse: boolean;
};

export type UniversePassDetailsWithSharedInfo = UniversePassDetails & {
	sharedDetails?: RobloxSharedExperiencePass;
};

export default function Passes({ universeId, canManageUniverse }: PassesProps) {
	const [targetUser, setTargetUser] = useState<RequestedUser>();
	const [targetUserOwned, setTargetUserOwned] = useState<number[] | null>(null);
	const [authenticatedUser] = useAuthenticatedUser();

	const requestUserId = targetUser?.id ?? authenticatedUser?.userId;
	const [sharedExperiencePasses] = usePromise(() => {
		return getRobloxSharedExperiencePasses({ universeId }).then((data) =>
			Promise.all(
				data.map((pass) =>
					getPassProductById({
						passId: pass.passId,
					}).then(async (data) => ({
						id: data.targetId,
						name: data.name,
						displayName: data.name,
						displayDescription: data.description || "",
						productId: data.productId,
						price: data.priceInRobux,
						isOwned: requestUserId
							? await userOwnsItem({
									userId: requestUserId,
									itemId: data.targetId,
									itemType: "GamePass",
								})
							: false,
						creator: {
							creatorType: data.creator.creatorType!,
							creatorId: data.creator.creatorTargetId!,
							name: data.creator.name!,
							deprecatedId: data.creator.id,
						},
						displayIconImageAssetId: data.iconImageAssetId,
						created: data.created,
						updated: data.updated,
						sharedDetails: pass,
					})),
				),
			),
		);
	}, [universeId, requestUserId]);

	const [filters, setFilters] = useState({
		includeOffSale: false,
		includeOnSale: true,

		includeOwned: true,
		includeNotOwned: true,
	});

	const {
		items,
		loading: pageLoading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		error,
		allItems,
		setPageNumber,
	} = usePages<UniversePassDetailsWithSharedInfo, string>({
		getNextPage: (state) =>
			listUniversePasses({
				universeId,
				pageSize: 50,
				passView: "Full",
				pageToken: state.nextCursor,
			}).then((data) => ({
				...state,
				items: data.gamePasses,
				nextCursor: data.nextPageToken ?? undefined,
				hasNextPage: !!data.nextPageToken,
			})),
		paging: {
			method: "pagination",
			itemsPerPage: 50,
		},
		items: {
			prefixItems: sharedExperiencePasses === undefined ? null : sharedExperiencePasses,
			filterItem: (item) => {
				const owned = targetUser ? targetUserOwned?.includes(item.id) : item.isOwned;

				return (
					(item.price === null ? filters.includeOffSale : filters.includeOnSale) &&
					(owned ? filters.includeOwned : filters.includeNotOwned)
				);
			},
		},
		dependencies: {
			refreshPage: [
				filters.includeOffSale,
				filters.includeOnSale,
				filters.includeOwned,
				filters.includeNotOwned,
				targetUserOwned,
				sharedExperiencePasses,
			],
		},
	});

	useEffect(() => {
		if (!targetUser || !allItems.length) return;

		setTargetUserOwned(null);
		const ownedPassIds: number[] = [];

		let eject = false;
		Promise.all(
			allItems.map((pass) =>
				userOwnsItem({
					userId: targetUser.id,
					itemId: pass.id,
					itemType: "GamePass",
				}).then((owned) => owned && ownedPassIds.push(pass.id)),
			),
		).then(() => {
			if (eject) return;

			setTargetUserOwned(ownedPassIds);
		});

		return () => {
			eject = true;
		};
	}, [targetUser?.id, allItems]);

	const loading = pageLoading || (targetUser !== undefined && !targetUserOwned);

	return (
		<div id="roseal-game-passes" className="container-list game-dev-store">
			<div className="container-header">
				<h3>{getMessage("experience.passes.title")}</h3>
			</div>
			{hasAnyItems && (
				<div className="pass-filters store-item-filters">
					<div className="pass-filter sale-status-filter store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage("experience.passes.filtering.saleStatus.label")}
							</span>
						</div>
						<div className="filters-list">
							<CheckboxField
								className="onsale-checkbox"
								disabled={loading}
								checked={filters.includeOnSale}
								onChange={(value) => {
									setFilters({ ...filters, includeOnSale: value });
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage("experience.passes.filtering.saleStatus.onSale")}
								</label>
							</CheckboxField>
							<CheckboxField
								className="offsale-checkbox"
								disabled={loading}
								checked={filters.includeOffSale}
								onChange={(value) => {
									setFilters({ ...filters, includeOffSale: value });
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage("experience.passes.filtering.saleStatus.offSale")}
								</label>
							</CheckboxField>
						</div>
					</div>
					<div className="pass-filter ownership-filter store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage("experience.passes.filtering.ownershipStatus.label")}
							</span>
						</div>
						<div className="filters-list">
							<CheckboxField
								className="owned-checkbox"
								disabled={loading}
								checked={filters.includeOwned}
								onChange={(value) => {
									setFilters({ ...filters, includeOwned: value });
								}}
							>
								<label className="checkbox-label text-label">
									{" "}
									{getMessage(
										"experience.passes.filtering.ownershipStatus.owned",
									)}
								</label>
							</CheckboxField>
							<CheckboxField
								className="not-owned-checkbox"
								disabled={loading}
								checked={filters.includeNotOwned}
								onChange={(value) => {
									setFilters({ ...filters, includeNotOwned: value });
								}}
							>
								<label className="checkbox-label text-label">
									{getMessage(
										"experience.passes.filtering.ownershipStatus.notOwned",
									)}
								</label>
							</CheckboxField>
						</div>
					</div>
					<div className="pass-filter target-user store-item-filter">
						<div className="filter-title">
							<span className="font-bold">
								{getMessage("experience.passes.filtering.targetUser")}
							</span>
						</div>
						<div className="filters-list">
							{!targetUser && <UserLookup updateUser={setTargetUser} />}
							{targetUser && (
								<div className="target-user-container">
									<AgentMentionContainer
										targetType="User"
										targetId={targetUser.id}
										name={targetUser.name}
										hasVerifiedBadge={targetUser.hasVerifiedBadge}
									/>
									<button
										type="button"
										className="remove-target-btn roseal-btn"
										onClick={() => {
											setTargetUser(undefined);
										}}
									>
										<Icon name="close" size="16x16" />
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
			<ul className="hlist store-cards roseal-store-cards">
				{!error &&
					!loading &&
					items.map((pass) => (
						<li className="list-item" key={pass.id}>
							<Pass
								passId={pass.id}
								name={pass.displayName}
								sellerId={pass.creator?.creatorId}
								sellerName={pass.creator?.name}
								productId={pass.productId}
								priceInRobux={pass.price}
								isOwned={
									targetUser ? targetUserOwned?.includes(pass.id) : pass.isOwned
								}
								sharedDetails={pass.sharedDetails}
								displayIcon={pass.displayIconImageAssetId}
							/>
						</li>
					))}
				{loading && !error && (
					<li className="list-item">
						<Loading />
					</li>
				)}

				{canManageUniverse && (
					<li className="list-item rbx-passes-item-container rbx-gear-passes-item-add">
						<div className="store-card">
							<a className="store-card-add" href={getManagePassesLink(universeId)}>
								{/* biome-ignore lint/a11y/useAltText: fine  */}
								<img src="https://images.rbxcdn.com/eae19a3a62261e2c3953d37fbc6ca626.png" />
								<div className="store-card-add-label">
									{getMessage("experience.passes.addPass")}
								</div>
							</a>
						</div>
					</li>
				)}
			</ul>

			{error && (
				<p className="section-content-off">{getMessage("experience.passes.error")}</p>
			)}

			{!loading && !hasAnyItems && !error && (
				<p className="section-content-off">{getMessage("experience.passes.noItems")}</p>
			)}

			{!loading && hasAnyItems && items.length === 0 && (
				<p className="section-content-off">
					{getMessage("experience.passes.noFilteredItems")}
				</p>
			)}

			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={(current) => {
						setPageNumber(current);
					}}
					disabled={loading}
				/>
			)}
		</div>
	);
}

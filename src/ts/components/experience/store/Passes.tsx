import { useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { userOwnsItem } from "src/ts/helpers/requests/services/inventory";
import {
	batchGetPassOwnerships,
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
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import Pass from "./Pass";
import FiltersContainer from "../../core/filters/FiltersContainer";

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

		let eject = false;
		batchGetPassOwnerships({
			ownershipIdentifiers: allItems.map((pass) => ({
				gamePassId: pass.id,
				userId: targetUser.id,
			})),
		}).then((data) => {
			if (eject) return;

			const ownedPassIds: number[] = [];
			for (const item of data) {
				if (item.owned) ownedPassIds.push(item.gamePassId);
			}

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
				<div className="store-item-filters">
					<FiltersContainer
						filters={[
							{
								id: "saleStatus",
								type: "checkbox",
								options: [
									{
										label: getMessage(
											"experience.passes.filtering.saleStatus.values.onSale",
										),
										value: true,
									},
									{
										label: getMessage(
											"experience.passes.filtering.saleStatus.values.offSale",
										),
										value: false,
									},
								],
								title: getMessage("experience.passes.filtering.saleStatus.label"),
								previewTitle: filters.includeOnSale
									? filters.includeOffSale
										? getMessage(
												"experience.passes.filtering.saleStatus.previewLabel.all",
											)
										: getMessage(
												"experience.passes.filtering.saleStatus.values.onSale",
											)
									: filters.includeOffSale
										? getMessage(
												"experience.passes.filtering.saleStatus.values.offSale",
											)
										: getMessage(
												"experience.passes.filtering.saleStatus.previewLabel.none",
											),
								defaultValue: [true],
								value: filters.includeOnSale
									? filters.includeOffSale
										? [true, false]
										: [true]
									: filters.includeOffSale
										? [false]
										: [],
							},
							{
								id: "ownershipStatus",
								type: "checkbox",
								options: [
									{
										label: getMessage(
											"experience.passes.filtering.ownershipStatus.values.owned",
										),
										value: true,
									},
									{
										label: getMessage(
											"experience.passes.filtering.ownershipStatus.values.notOwned",
										),
										value: false,
									},
								],
								previewTitle: filters.includeOwned
									? filters.includeNotOwned
										? getMessage(
												"experience.passes.filtering.ownershipStatus.previewLabel.all",
											)
										: getMessage(
												"experience.passes.filtering.ownershipStatus.values.owned",
											)
									: filters.includeNotOwned
										? getMessage(
												"experience.passes.filtering.ownershipStatus.values.notOwned",
											)
										: getMessage(
												"experience.passes.filtering.ownershipStatus.previewLabel.none",
											),
								title: getMessage(
									"experience.passes.filtering.ownershipStatus.label",
								),
								defaultValue: [true],
								value: filters.includeOwned
									? filters.includeNotOwned
										? [true, false]
										: [true]
									: filters.includeNotOwned
										? [false]
										: [],
							},
							{
								id: "targetUser",
								type: "user",
								title: getMessage("experience.passes.filtering.viewAs.label"),
								previewTitle: targetUser
									? getMessage(
											"experience.passes.filtering.viewAs.previewLabel.someone",
											{
												username: targetUser.displayName,
											},
										)
									: getMessage(
											"experience.passes.filtering.viewAs.previewLabel.you",
										),
								defaultLabel: getMessage(
									"experience.passes.filtering.viewAs.defaultLabel",
								),
								value: targetUser,
							},
						]}
						applyFilterValue={(id, value) => {
							if (id === "saleStatus") {
								setFilters({
									...filters,
									includeOnSale: (value as boolean[]).includes(true),
									includeOffSale: (value as boolean[]).includes(false),
								});
							} else if (id === "ownershipStatus") {
								setFilters({
									...filters,
									includeOwned: (value as boolean[]).includes(true),
									includeNotOwned: (value as boolean[]).includes(false),
								});
							} else if (id === "targetUser") {
								setTargetUser(value as RequestedUser | undefined);
							}
						}}
					/>
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

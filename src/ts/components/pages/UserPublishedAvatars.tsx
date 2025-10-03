import { getEditAvatarLink } from "src/ts/utils/links";
import Button from "../core/Button";
import useProfileData from "../hooks/useProfileData";
import usePages from "../hooks/usePages";
import { useEffect, useRef, useState } from "preact/hooks";
import {
	deleteUserLook,
	type HydratedWidgetLook,
	hydrateMarketplaceWidget,
	listUserLooks,
} from "src/ts/helpers/requests/services/marketplace";
import { RESTError } from "@roseal/http-client/src";
import Loading from "../core/Loading";
import { useIntersection } from "../hooks/useIntersection";
import MarketplaceCard from "../marketplace/Card";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import ItemContextMenu from "../core/ItemContextMenu";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import useFeatureValue from "../hooks/useFeatureValue";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type UserPublishedAvatarsProps = {
	userId: number;
};

export default function UserPublishedAvatars({ userId }: UserPublishedAvatarsProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [includeUsernameInTitle] = useFeatureValue("userPagesNewTitle", false);

	const isViewingAuthenticatedUser = userId === authenticatedUser?.userId;
	const profileData = useProfileData({
		userId,
	});
	const loadingRef = useRef<HTMLDivElement>(null);

	const [canViewLooks, setCanViewLooks] = useState(true);
	const {
		items,
		error,
		hasAnyItems,
		loading,
		fetchedAllPages,
		maxPageNumber,
		pageNumber,
		setPageNumber,
		removeItem,
	} = usePages<HydratedWidgetLook, string>({
		getNextPage: (state) =>
			listUserLooks({
				userId,
				cursor: state.nextCursor,
				limit: 50,
			})
				.then((data) =>
					hydrateMarketplaceWidget({
						content: data.data.map((item) => ({
							type: "Look",
							id: item.lookId,
						})),
					}).then((hydrated) => ({
						...state,
						items: hydrated as HydratedWidgetLook[],
						nextCursor: data.nextCursor ?? undefined,
						hasNextPage: !!data.nextCursor,
					})),
				)
				.catch((err) => {
					if (
						err instanceof RESTError &&
						err.errors?.[0]?.message ===
							"User is not authorized to perform this action."
					) {
						setCanViewLooks(false);
					}

					return {
						...state,
						hasNextPage: false,
					};
				}),
		paging: {
			method: "loadMore",
			initialCount: 50,
			incrementCount: 50,
		},
		dependencies: {
			reset: [userId],
		},
	});

	const isIntersecting = useIntersection(loadingRef);
	useEffect(() => {
		if (isIntersecting && !loading && maxPageNumber > pageNumber && items.length > 0) {
			setPageNumber(pageNumber + 1);
		}
	}, [isIntersecting, loading]);

	return (
		<div id="published-avatars">
			<div className="avatars-title">
				<h1 className="text-overflow">
					{!includeUsernameInTitle || !profileData
						? getMessage("userAvatars.title", {
								displayName: profileData?.names.combinedName || "",
							})
						: getMessage("userAvatars.title.withUsername", {
								displayName: profileData.names.combinedName,
								username: profileData.names.username,
							})}
				</h1>
				{canViewLooks && (
					<div className="publish-more-text-container small text">
						<p className="publish-more-text">
							{getMessage("userAvatars.postMessage.message")}
						</p>
						<Button
							as="a"
							type="growth"
							href={getEditAvatarLink()}
							width="default"
							className="publish-avatar-btn"
						>
							{getMessage("userAvatars.postMessage.buttonText")}
						</Button>
					</div>
				)}
			</div>
			{!hasAnyItems && canViewLooks && fetchedAllPages && (
				<p className="section-content-off">{getMessage("userAvatars.list.noItems")}</p>
			)}
			{!canViewLooks && (
				<p className="section-content-off">
					{getMessage("userAvatars.list.notAuthorized")}
				</p>
			)}
			{canViewLooks && !error && (
				<div className="avatar-looks-section">
					<ul className="looks-container-list">
						{items.map((look) => (
							<MarketplaceCard
								key={look.id}
								type="Look"
								id={look.id}
								name={look.name || ""}
								totalValue={look.totalValue}
								totalPrice={look.totalPrice}
							>
								{isViewingAuthenticatedUser && (
									<ItemContextMenu containerClassName="look-context-menu">
										<button
											type="button"
											className="roseal-btn"
											onClick={() => {
												deleteUserLook({
													lookId: look.id,
												})
													.then(() => removeItem(look))
													.catch(() => {
														warning(
															"Could not delete published avatar.",
														);
													});
											}}
										>
											{getMessage(
												"userAvatars.list.item.contextMenu.deleteAvatar",
											)}
										</button>
									</ItemContextMenu>
								)}
							</MarketplaceCard>
						))}
					</ul>
					{!fetchedAllPages && (
						<div className="items-loading-container" ref={loadingRef}>
							<Loading />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

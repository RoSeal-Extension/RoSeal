import {
	type HydratedWidgetLook,
	hydrateMarketplaceWidget,
	listUserLooks,
} from "src/ts/helpers/requests/services/marketplace";
import { getUserAvatarsLink } from "src/ts/utils/links";
import Icon from "../../../core/Icon";
import usePromise from "../../../hooks/usePromise";
import MarketplaceCard from "src/ts/components/marketplace/Card";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type UserProfilePublishedAvatarsProps = {
	userId: number;
};

export default function UserProfilePublishedAvatars({ userId }: UserProfilePublishedAvatarsProps) {
	const [looks] = usePromise(
		() =>
			listUserLooks({
				userId,
				limit: 10,
			}).then((looks) =>
				hydrateMarketplaceWidget({
					content: looks.data.slice(0, 6).map((item) => ({
						type: "Look",
						id: item.lookId,
					})),
				}),
			) as Promise<HydratedWidgetLook[]>,
		[userId],
	);

	// don't render it, probably doesnt have access
	if (!looks) return null;

	return (
		<div className="profile-published-avatars">
			<div className="profile-carousel">
				<div className="collection-carousel-container">
					<div>
						<a href={getUserAvatarsLink(userId)} className="items-center inline-flex">
							<h2 className="content-emphasis text-heading-small padding-none inline-block">
								{getMessage("user.avatars.title")}
							</h2>
							<Icon name="chevron-heavy-right" />
						</a>
					</div>
					<div className="carousel-container">
						<div className="carousel">
							{looks.map((look) => (
								<div key={look.id} className="carousel-item">
									<MarketplaceCard
										as="div"
										type="Look"
										id={look.id}
										totalValue={look.totalValue}
										totalPrice={look.totalPrice}
										name={look.name || ""}
										containerClassName="item-card profile-item-card"
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

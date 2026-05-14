import MdOutlineAddFilled from "@material-symbols/svg-600/outlined/add-fill.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getUserFriendsLink } from "src/ts/utils/links";
import LazyLink from "../core/LazyLink";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";

export type ConnectCardProps = {
	count?: number | null;
};

export default function ConnectCard({ count }: ConnectCardProps) {
	const [authenticatedUser] = useAuthenticatedUser();

	return (
		<div>
			<div className="friends-carousel-tile">
				<button type="button" id="friend-tile-button">
					<LazyLink
						href={
							authenticatedUser
								? getUserFriendsLink(authenticatedUser.userId, "friend-requests")
								: undefined
						}
					>
						<div className="add-friends-icon-container">
							{!!count && (
								<span className="friend-request-badge">
									{asLocaleString(count)}
								</span>
							)}
							<MdOutlineAddFilled className="roseal-icon add-friends-icon" />
						</div>
						<div
							className="friends-carousel-tile-labels"
							data-testid="friends-carousel-tile-labels"
						>
							<div className="friends-carousel-tile-label">
								<div className="friends-carousel-tile-name">
									<span className="friends-carousel-display-name">
										{getMessage("connectionsCarousel.card.connect")}
									</span>
								</div>
							</div>
						</div>
					</LazyLink>
				</button>
			</div>
		</div>
	);
}

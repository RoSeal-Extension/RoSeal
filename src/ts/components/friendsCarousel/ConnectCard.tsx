import { getUserFriendsLink } from "src/ts/utils/links";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import LazyLink from "../core/LazyLink";
import MdOutlineAddFilled from "@material-symbols/svg-600/outlined/add-fill.svg";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";

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
								? getUserFriendsLink(authenticatedUser.userId)
								: undefined
						}
					>
						<div className="add-friends-icon-container">
							{count && count > 0 && (
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
									<span className="friends-carousel-display-name">Connect</span>
								</div>
							</div>
						</div>
					</LazyLink>
				</button>
			</div>
		</div>
	);
}

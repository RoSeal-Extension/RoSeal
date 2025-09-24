import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserProfileLink } from "src/ts/utils/links";
import Button from "../../core/Button";
import ItemContextMenu from "../../core/ItemContextMenu";
import Thumbnail from "../../core/Thumbnail";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import VerifiedBadge from "../../icons/VerifiedBadge";

export type AccountItemNodeData = {
	userId: number;
	displayName?: string;
	username?: string;
	isVerified?: boolean;
};

export type AccountItemProps = {
	node: NodeModel<AccountItemNodeData>;
	render: RenderParams;
	remove: () => void;
	login: () => void;
};

export default function AccountItem({ node, render, remove, login }: AccountItemProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const data = node.data!;

	const isLoggedIn = authenticatedUser?.userId === data.userId;

	return (
		<div
			className={classNames("account-item", {
				"is-dragging": render.isDragging,
			})}
		>
			<a
				className="account-details-container text-overflow"
				href={getUserProfileLink(data.userId)}
			>
				<div className="account-thumbnail avatar avatar-headshot">
					<Thumbnail
						request={{
							targetId: data.userId,
							size: "48x48",
							type: "AvatarHeadShot",
						}}
					/>
				</div>
				<div className="account-names-container">
					<div className="display-name-container text-emphasis small">
						<span className="display-name text-overflow">{data?.displayName}</span>
						{data.isVerified && (
							<span className="verified-badge-container">
								<VerifiedBadge width={12} height={12} />
							</span>
						)}
					</div>
					<div className="username-container xsmall text">
						<span className="username text-overflow">
							{data.username && `@${data.username}`}
						</span>
					</div>
				</div>
			</a>
			<div className="account-btns-container">
				<Button
					className="switch-account-btn"
					disabled={isLoggedIn}
					onClick={login}
					as="span"
					size="xs"
					type="secondary"
				>
					{getMessage(
						isLoggedIn ? "accountsManager.item.loggedIn" : "accountsManager.item.login",
					)}
				</Button>
				<ItemContextMenu
					containerClassName="item-context-menu item-context-menu-vertical"
					className="manage-account-context-menu"
					wrapChildren={false}
					setContainer={false}
				>
					<li>
						<button
							type="button"
							onClick={(e) => {
								remove();
								e.stopImmediatePropagation();
							}}
						>
							{getMessage("accountsManager.item.remove")}
						</button>
					</li>
				</ItemContextMenu>
			</div>
		</div>
	);
}

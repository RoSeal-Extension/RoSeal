import type messagesType from "#i18n/types";
import MdOutlineSwitchAccount from "@material-symbols/svg-400/outlined/switch_account-fill.svg";
import { MultiBackend, Tree, getBackendOptions } from "@minoru/react-dnd-treeview";
import classNames from "classnames";
import { differenceInYears } from "date-fns";
import type { JSX } from "preact";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { DndProvider } from "react-dnd";
import {
	ACCOUNTS_SHOW_AGE_BRACKET_FEATURE_ID,
	ACCOUNTS_SHOW_AUTHENTICATED_USER_PILL_FEATURE_ID,
	ROBLOX_ACCOUNT_LIMIT,
} from "src/ts/constants/accountsManager";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { invokeMessage } from "src/ts/helpers/communication/background";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	getBirthdate,
	getCurrentAuthenticatedUser,
} from "src/ts/helpers/requests/services/account";
import { getUserProfileLink } from "src/ts/utils/links";
import Button from "../../core/Button";
import Divider from "../../core/Divider";
import Loading from "../../core/Loading";
import Popover from "../../core/Popover";
import Thumbnail from "../../core/Thumbnail";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePromise from "../../hooks/usePromise";
import VerifiedBadge from "../../icons/VerifiedBadge";
import AccountItem, { type AccountItemNodeData } from "./AccountItem";
import useProfilesData from "../../hooks/useProfilesData";

export type AccountsPopoverProps = {
	button: JSX.Element;
	container?: HTMLLIElement | null;
};
function AccountsPopover({ container, button }: AccountsPopoverProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [disabled, setDisabled] = useState(false);
	const [accountsData, , , refetchAccountsData] = usePromise(
		() => invokeMessage("listRobloxAccounts", undefined),
		[],
		false,
	);
	const [accounts] = useProfilesData(accountsData || undefined);
	const [successKey, setSuccessKey] = useState<keyof typeof messagesType>();
	const [errorKey, setErrorKey] = useState<keyof typeof messagesType>();

	const treeLayout = useMemo(() => {
		return accountsData?.map((account) => {
			const profileData = accounts.find((account2) => account.userId === account2.userId);

			return {
				id: account.userId,
				parent: 0,
				text: profileData?.names.displayName ?? account.userId.toString(),
				data: {
					userId: account.userId,
					displayName: profileData?.names.displayName,
					username: profileData?.names.username,
					isVerified: profileData?.isVerified,
				},
			};
		});
	}, [accountsData, accounts]);

	const updateFromTreeLayout = useCallback((accounts: AccountItemNodeData[]) => {
		invokeMessage("sortRobloxAccounts", accounts).then(refetchAccountsData);
	}, []);

	const resetDisabled = useCallback(() => {
		setDisabled(true);
		setSuccessKey(undefined);
		setErrorKey(undefined);
	}, []);

	const loginAccount = useCallback(
		(userId: number) => {
			resetDisabled();

			invokeMessage("switchRobloxAccount", {
				userId,
			})
				.then(() => {
					location.reload();
				})
				.catch(() => {
					setDisabled(false);
					setErrorKey("accountsManager.error.failedSwitch");
				});
		},
		[resetDisabled],
	);
	const removeAccount = useCallback(
		(userId: number) => {
			resetDisabled();

			invokeMessage("removeRobloxAccount", {
				userId,
			})
				.then(() => {
					refetchAccountsData();
					if (userId === authenticatedUser?.userId) {
						location.reload();
					}
					setSuccessKey("accountsManager.success.removedAccount");
				})
				.catch(() => {
					setErrorKey("accountsManager.error.failedRemove");
				})
				.finally(() => setDisabled(false));
		},
		[resetDisabled, authenticatedUser?.userId],
	);

	const canAddAccount = !!accounts && accounts.length < ROBLOX_ACCOUNT_LIMIT;
	const isCurrentAccountAdded = useMemo(
		() => accountsData?.some((item) => item.userId === authenticatedUser?.userId) === true,
		[accountsData, authenticatedUser?.userId],
	);

	return (
		<Popover
			className="accounts-popover"
			trigger="click"
			placement="bottom"
			button={button}
			container={container}
		>
			<div className="popover-content">
				<div
					className={classNames("dropdown-menu accounts-container", {
						"roseal-disabled": disabled,
						"has-accounts-list": !!accountsData?.length,
					})}
				>
					<div className="accounts-manager-header">
						<span className="text-label font-caption-header">
							{getMessage("accountsManager.title", {
								sealEmoji: SEAL_EMOJI_COMPONENT,
							})}
						</span>
					</div>
					{!accountsData && <Loading />}
					{accountsData && (
						<>
							{accountsData.length > 0 && (
								<>
									<DndProvider
										backend={MultiBackend}
										options={getBackendOptions()}
									>
										<Tree
											classes={{
												placeholder: "drop-placeholder",
												listItem: "account-item-container",
												root: "accounts-list rbx-scrollbar roseal-scrollbar",
											}}
											sort={false}
											tree={treeLayout!}
											rootId={0}
											render={(node, render) => {
												return (
													<AccountItem
														node={node}
														render={render}
														login={() =>
															loginAccount(node.data!.userId)
														}
														remove={() =>
															removeAccount(node.data!.userId)
														}
													/>
												);
											}}
											onDrop={(data) =>
												updateFromTreeLayout(data.map((item) => item.data!))
											}
											canDrop={(_, options) => !options.dropTargetId}
											placeholderRender={() => (
												<div className="drop-placeholder-item" />
											)}
										/>
									</DndProvider>
									{authenticatedUser && <Divider />}
								</>
							)}
							{authenticatedUser && (
								<div className="actions">
									{(successKey || errorKey) && (
										<div className="actions-feedback">
											{successKey && (
												<div className="text-success xsmall">
													{getMessage(successKey)}
												</div>
											)}
											{errorKey && (
												<div className="text-error xsmall">
													{getMessage(errorKey)}
												</div>
											)}
										</div>
									)}
									<div className="text small actions-info">
										{accountsData.length === 0
											? getMessage(
													authenticatedUser
														? "accountsManager.noAccounts"
														: "accountsManager.noAccounts.disabled",
												)
											: getMessage(
													canAddAccount
														? "accountsManager.addAccount"
														: "accountsManager.maxAccounts",
													{
														accountLimit:
															asLocaleString(ROBLOX_ACCOUNT_LIMIT),
														accountsNum: asLocaleString(
															accountsData.length,
														),
														bold: (contents: string) => (
															<b>{contents}</b>
														),
														moreAccounts:
															ROBLOX_ACCOUNT_LIMIT -
															accountsData.length,
													},
												)}
									</div>
									<div className="actions-btns">
										<Button
											className="add-account-btn"
											disabled={!canAddAccount || disabled}
											type="growth"
											size="xs"
											onClick={() => {
												resetDisabled();

												getCurrentAuthenticatedUser()
													.then((data) =>
														invokeMessage("addCurrentRobloxAccount", {
															userId: data.id,
														}),
													)
													.then(() => {
														refetchAccountsData();
														setSuccessKey(
															isCurrentAccountAdded
																? "accountsManager.success.updatedAccount"
																: "accountsManager.success.addedAccount",
														);
													})
													.catch(() => {
														setErrorKey(
															"accountsManager.error.failedAdd",
														);
													})
													.finally(() => {
														setDisabled(false);
													});
											}}
										>
											{getMessage(
												isCurrentAccountAdded
													? "accountsManager.actions.updateCurrentAccount"
													: "accountsManager.actions.addCurrentAccount",
											)}
										</Button>
										<Button
											className="remove-session-btn"
											disabled={disabled}
											type="secondary"
											size="xs"
											onClick={() => {
												resetDisabled();

												invokeMessage("logoutRobloxSession", undefined)
													.then(() => {
														location.reload();
													})
													.catch(() => {
														setErrorKey(
															"accountsManager.error.failedLogout",
														);
													});
											}}
										>
											{getMessage("accountsManager.actions.logout")}
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</Popover>
	);
}

export default function AccountsPopoverButton() {
	const [ageBracketEnabled] = useFeatureValue(ACCOUNTS_SHOW_AGE_BRACKET_FEATURE_ID, [
		false,
		"regular",
	]);
	const [isAuthenticatedUserPillEnabled] = useFeatureValue(
		ACCOUNTS_SHOW_AUTHENTICATED_USER_PILL_FEATURE_ID,
		false,
	);
	const [authenticatedUser] = useAuthenticatedUser();
	const [isOpen, setIsOpen] = useState(false);
	const [birthday] = usePromise(() => {
		if (!authenticatedUser || !ageBracketEnabled?.[0]) {
			return;
		}

		return getBirthdate().then((birthdate) => {
			if (!birthdate.birthYear) {
				return;
			}
			const date = new Date();
			date.setFullYear(birthdate.birthYear);
			date.setMonth((birthdate.birthMonth ?? 1) - 1);
			date.setDate(birthdate.birthDay ?? 1);

			return date;
		});
	}, [authenticatedUser?.userId, ageBracketEnabled?.[0]]);
	const ageBracket = useMemo(() => {
		if (!birthday) {
			return;
		}
		const years = differenceInYears(new Date(), birthday);
		if (years < 13) {
			return "<13";
		}

		if (years > 13 && (years < 17 || ageBracketEnabled?.[1] !== "expanded")) {
			return "13+";
		}

		if (years === 17) {
			return "17+";
		}

		return "18+";
	}, [ageBracketEnabled?.[0], ageBracketEnabled?.[1], birthday]);
	const containerRef = useRef<HTMLLIElement>(null);

	return (
		<li ref={containerRef} id="navbar-accounts" className="navbar-icon-item">
			<AccountsPopover
				button={
					<button
						type="button"
						className={classNames("btn-navigation-accounts btn-generic-navigation", {
							"btn-navigation-accounts-logged-in":
								authenticatedUser && isAuthenticatedUserPillEnabled,
						})}
						onClick={() => setIsOpen(!isOpen)}
					>
						{authenticatedUser && isAuthenticatedUserPillEnabled ? (
							<a
								className="rbx-menu-item user-container"
								href={getUserProfileLink(authenticatedUser.userId)}
								onClick={(e) => e.preventDefault()}
							>
								<div className="avatar">
									<Thumbnail
										request={{
											type: "AvatarHeadShot",
											targetId: authenticatedUser.userId,
											size: "48x48",
										}}
										containerClassName="avatar-card-image"
									/>
								</div>
								<div className="account-names-container">
									<div className="display-name-container text-emphasis small">
										<span className="display-name text-overflow">
											{authenticatedUser.displayName}
										</span>
										{authenticatedUser.hasVerifiedBadge && (
											<span className="verified-badge-container">
												<VerifiedBadge width={12} height={12} />
											</span>
										)}
									</div>
									<div className="username-container xsmall text">
										<span className="username text-overflow">
											@{authenticatedUser.username}
										</span>
									</div>
								</div>
								{ageBracket && (
									<span className="current-age-bracket-label xsmall text">
										{ageBracket}
									</span>
								)}
							</a>
						) : (
							<span id="nav-accounts-icon" className="rbx-menu-item">
								<MdOutlineSwitchAccount className="roseal-icon" />
							</span>
						)}
					</button>
				}
				container={containerRef.current}
			/>
		</li>
	);
}

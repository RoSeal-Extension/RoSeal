import { useState } from "preact/hooks";
import Thumbnail from "./Thumbnail.tsx";
import classNames from "classnames";
import VerifiedBadge from "../icons/VerifiedBadge.tsx";
import { useDebounceValue } from "usehooks-ts";
import usePromise from "../hooks/usePromise.ts";
import { getMessage } from "../../helpers/i18n/getMessage.ts";
import { multigetUsersByNames, type RequestedUser } from "../../helpers/requests/services/users.ts";
import { search } from "src/ts/helpers/requests/services/misc.ts";
import type { RESTError } from "src/ts/helpers/requests/main.ts";
import { getUserProfileLink } from "src/ts/utils/links.ts";
import ItemLookup from "./ItemLookup.tsx";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor.ts";

export type UserLookupProps = {
	className?: string;
	updateUser: (user: RequestedUser) => void;
};

export default function UserLookup({ className, updateUser }: UserLookupProps) {
	const [input, setInput] = useState<string>("");
	const [username, setUsername] = useDebounceValue(input, 500);

	const [data, fetched, error] = usePromise(
		() =>
			input && input === username && username.length > 2
				? search({
						searchQuery: username,
						verticalType: "User",
						sessionId: crypto.randomUUID(),
						pageType: "all",
					}).then((data) =>
						profileProcessor.requestBatch(
							data.searchResults[0]?.contents?.slice(0, 5).map((user) => ({
								userId: user.contentId,
							})),
						),
					)
				: undefined,
		[input, username],
	);
	const [directLoading, setDirectLoading] = useState<boolean>(false);
	const [directError, setDirectError] = useState<string>();

	return (
		<ItemLookup
			className={classNames("user-lookup", className)}
			items={data?.map((item) => ({
				...item,
				key: item.userId,
			}))}
			onClick={(user) => {
				updateUser({
					displayName: user.names.displayName,
					id: user.userId,
					name: user.names.username,
					hasVerifiedBadge: user.isVerified,
				});
				setInput("");
			}}
			render={(user) => {
				return (
					<a
						className="search-result-format"
						href={getUserProfileLink(user.userId)}
						onClick={(e) => {
							e.preventDefault();
						}}
					>
						<div className="search-result-icon avatar-headshot">
							<Thumbnail
								request={{
									type: "AvatarHeadShot",
									targetId: user.userId,
									size: "48x48",
								}}
							/>
						</div>
						<div className="search-result-name text-overflow">
							<span className="paired-name">
								<span className="element">
									{user.names.displayName}
									{user.isVerified && <VerifiedBadge height={16} width={16} />}
								</span>
								<span className="connector">@</span>
								<span className="element">{user.names.username}</span>
							</span>
						</div>
					</a>
				);
			}}
			loading={directLoading || !fetched}
			errorMessage={directError || (error as RESTError)?.errors?.[0]?.message}
			inputPlaceholder={getMessage("userLookup.placeholder")}
			inputClassName="user-lookup-field"
			onType={(value) => {
				setDirectError(undefined);

				setInput(value);
				setUsername(value);
			}}
			inputValue={input}
			onSubmit={(value) => {
				setDirectLoading(true);
				setDirectError(undefined);

				multigetUsersByNames({
					usernames: [value],
				})
					.then(([user]) => {
						if (user) {
							updateUser(user);
							setInput("");
						} else {
							setDirectError(getMessage("userLookup.directLookupError"));
						}

						setDirectLoading(false);
					})
					.catch((error: RESTError) => {
						setDirectError(error?.errors?.[0].message);

						setDirectLoading(false);
					});
			}}
		/>
	);
}

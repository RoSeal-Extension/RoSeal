import { useMemo, useState } from "preact/hooks";
import { searchConfigurableUniverses } from "src/ts/helpers/requests/services/universes";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useStorage from "../../hooks/useStorage";
import {
	ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY,
	type AccountTrackingPreventionAccount,
	type AccountTrackingPreventionStorageValue,
} from "src/ts/constants/accountTrackingPrevention";
import Toggle from "../../core/Toggle";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getExperienceLink, getRobloxSettingsLink } from "src/ts/utils/links";
import usePromise from "../../hooks/usePromise";
import Loading from "../../core/Loading";
import { multigetPlacesByIds, type Place } from "src/ts/helpers/requests/services/places";
import ItemLookup from "../../core/ItemLookup";
import { useDebounceValue } from "usehooks-ts";
import Thumbnail from "../../core/Thumbnail";
import { multigetUniversePermissions } from "src/ts/helpers/requests/services/permissions";
import Button from "../../core/Button";
import classNames from "classnames";

export default function AccountTrackingPreventionTab() {
	const [storageValue, setStorageValue] = useStorage<AccountTrackingPreventionStorageValue>(
		ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY,
		{
			accounts: {},
		},
	);
	const [authenticatedUser] = useAuthenticatedUser();

	const userData = useMemo(
		() =>
			(authenticatedUser && storageValue?.accounts?.[authenticatedUser.userId]) ??
			({
				onlineStatus: {
					enabled: false,
					type: "online",
				},
				rapidAvatarUpdate: {
					enabled: false,
				},
			} as AccountTrackingPreventionAccount),
		[storageValue, authenticatedUser?.userId],
	);
	const [studioPlaces, studioPlacesFetched, studioPlacesError] = usePromise(() => {
		if (!userData.onlineStatus.studioPlaceIds?.length) return [] as Place[];

		return multigetPlacesByIds({
			placeIds: userData.onlineStatus.studioPlaceIds,
		});
	}, [userData.onlineStatus.studioPlaceIds]);
	const [input, setInput] = useState<string>("");
	const [experienceName, setExperienceName] = useDebounceValue(input, 500);

	const [addErrorMessage, setAddErrorMessage] = useState("");

	const [isUpdating, setIsUpdating] = useState(false);
	const [searchResults, searchResultsFetched] = usePromise(() => {
		if (!experienceName || !authenticatedUser?.userId) return [];

		return searchConfigurableUniverses({
			search: experienceName,
			creatorTargetId: authenticatedUser.userId,
			creatorType: "User",
			pageSize: 5,
		}).then((data) => data.data);
	}, [experienceName, authenticatedUser?.userId]);

	const updateUserData = (data: AccountTrackingPreventionAccount) => {
		setStorageValue({
			...storageValue,
			accounts: {
				...storageValue.accounts,
				[authenticatedUser?.userId!]: data,
			},
		});
	};

	return (
		<div className="account-tracking-prevention-section-container">
			<div id="online-status-container" className="section atp-section">
				<div className="container-header">
					<h2>{getMessage("accountTrackingPrevention.onlineStatus.title")}</h2>
					<Toggle
						isOn={userData.onlineStatus.enabled}
						onToggle={() => {
							updateUserData({
								...userData,
								onlineStatus: {
									...userData.onlineStatus,
									enabled: !userData.onlineStatus.enabled,
								},
							});
						}}
					/>
				</div>
				<div className="section online-status-section">
					<p className="section-description">
						{getMessage("accountTrackingPrevention.onlineStatus.description")}
					</p>
					<ul className="status-options">
						<li className="status-option">
							<div
								className="radio"
								onClick={() => {
									updateUserData({
										...userData,
										onlineStatus: {
											...userData.onlineStatus,
											type: "online",
										},
									});
								}}
							>
								<input
									type="radio"
									checked={userData.onlineStatus.type === "online"}
								/>
								<label>
									{getMessage(
										"accountTrackingPrevention.onlineStatus.statuses.online",
									)}
								</label>
							</div>
						</li>
						<li className="status-option studio-status-option">
							<div
								className={classNames("radio", {})}
								onClick={() => {
									updateUserData({
										...userData,
										onlineStatus: {
											...userData.onlineStatus,
											type: "studio",
										},
									});
								}}
							>
								<input
									type="radio"
									checked={userData.onlineStatus.type === "studio"}
								/>
								<label>
									{getMessage(
										"accountTrackingPrevention.onlineStatus.statuses.inStudio",
									)}
								</label>
							</div>
							<div className="lookup-experiences-container">
								{(userData.onlineStatus.studioPlaceIds?.length ?? 0) < 10 && (
									<ItemLookup
										className="experiences-lookup"
										items={searchResults?.map((item) => ({
											key: item.rootPlaceId,
											...item,
										}))}
										inputDisabled={isUpdating}
										onSubmit={(value) => {
											const placeId = Number.parseInt(value, 10);
											if (!placeId)
												return setAddErrorMessage(
													getMessage(
														"accountTrackingPrevention.onlineStatus.experienceLookup.errors.invalidPlaceId",
													),
												);

											setIsUpdating(true);
											setAddErrorMessage("");

											multigetPlacesByIds({
												placeIds: [placeId],
											})
												.then((data) => {
													const universeId = data[0]?.universeId;
													if (!universeId)
														return setAddErrorMessage(
															getMessage(
																"accountTrackingPrevention.onlineStatus.experienceLookup.errors.noUniverse",
															),
														);

													return multigetUniversePermissions({
														universeIds: [universeId],
													}).then((permissions) => {
														if (!permissions[0].canManage)
															return setAddErrorMessage(
																getMessage(
																	"accountTrackingPrevention.onlineStatus.experienceLookup.errors.noPermissions",
																),
															);

														return updateUserData({
															...userData,
															onlineStatus: {
																...userData.onlineStatus,
																studioPlaceIds: [
																	...new Set([
																		...(userData.onlineStatus
																			?.studioPlaceIds ?? []),
																		placeId,
																	]),
																],
															},
														});
													});
												})
												.catch(() => {
													setAddErrorMessage(
														getMessage(
															"accountTrackingPrevention.onlineStatus.experienceLookup.errors.invalidPlaceId",
														),
													);
												})
												.finally(() => {
													setIsUpdating(false);
												});
										}}
										onClick={async (item) => {
											setInput("");
											setExperienceName("");
											setAddErrorMessage("");

											updateUserData({
												...userData,
												onlineStatus: {
													...userData.onlineStatus,
													studioPlaceIds: [
														...new Set([
															...(userData.onlineStatus
																?.studioPlaceIds ?? []),
															item.rootPlaceId,
														]),
													],
												},
											});
										}}
										loading={!searchResultsFetched || isUpdating}
										render={(item) => {
											return (
												<a
													className="search-result-format"
													href={getExperienceLink(
														item.rootPlaceId,
														item.name,
													)}
													onClick={(e) => {
														e.preventDefault();
													}}
												>
													<div className="search-result-icon">
														<Thumbnail
															request={{
																type: "Asset",
																targetId: item.rootPlaceId,
																size: "75x75",
															}}
														/>
													</div>
													<div className="search-result-detail text-overflow">
														<div className="search-result-name text-overflow text-emphasis">
															{item.name}
														</div>
													</div>
												</a>
											);
										}}
										inputPlaceholder={getMessage(
											"accountTrackingPrevention.onlineStatus.experienceLookup.search.placeholder",
										)}
										inputClassName="experience-lookup-field"
										onType={(value) => {
											setInput(value);
										}}
										inputValue={input}
									>
										{addErrorMessage && (
											<div className="text-error">{addErrorMessage}</div>
										)}
									</ItemLookup>
								)}
								<div className="section-content experiences-list-container">
									{!studioPlacesFetched && <Loading />}
									{studioPlacesFetched && !studioPlaces?.length && (
										<p className="experiences-list-empty">
											{getMessage(
												"accountTrackingPrevention.onlineStatus.experienceLookup.list.emptyList",
											)}
										</p>
									)}
									{studioPlacesError && (
										<p className="experiences-list-empty">
											{getMessage(
												"accountTrackingPrevention.onlineStatus.experienceLookup.list.error",
											)}
										</p>
									)}
									<ul className="experiences-list roseal-scrollbar">
										{studioPlaces?.map((place) => (
											<li key={place.placeId} className="experience-item">
												<div className="experience-container dynamic-overflow-container">
													<div className="experience-icon">
														<Thumbnail
															request={{
																type: "Asset",
																targetId: place.placeId,
																size: "75x75",
															}}
														/>
													</div>
													<a
														href={getExperienceLink(
															place.placeId,
															place.name,
														)}
														className="text-name experience-name dynamic-ellipsis-item"
													>
														{place.name}
													</a>
													<Button
														type="control"
														className="remove-item-btn"
														size="xs"
														onClick={() => {
															const newPlaceIds =
																userData.onlineStatus.studioPlaceIds?.filter(
																	(id) => id !== place.placeId,
																);
															updateUserData({
																...userData,
																onlineStatus: {
																	...userData.onlineStatus,
																	studioPlaceIds: newPlaceIds,
																},
															});
														}}
													>
														{getMessage(
															"accountTrackingPrevention.onlineStatus.experienceLookup.list.item.remove",
														)}
													</Button>
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
						</li>
					</ul>
				</div>
			</div>
			<div id="server-sniping-container" className="section atp-section">
				<div className="container-header">
					<h2>{getMessage("accountTrackingPrevention.serverSniping.title")}</h2>
					<Toggle
						isOn={userData.rapidAvatarUpdate.enabled}
						onToggle={() => {
							updateUserData({
								...userData,
								rapidAvatarUpdate: {
									enabled: !userData.rapidAvatarUpdate.enabled,
								},
							});
						}}
					/>
				</div>
				<div className="section server-sniping-section">
					<p className="section-description">
						{getMessage("accountTrackingPrevention.serverSniping.description", {
							lineBreak: <br />,
							privacySettingsLink: (contents: string) => (
								<a
									className="text-name"
									href={getRobloxSettingsLink(
										"privacy/VisibilityAndPrivateServers/Visibility",
									)}
								>
									{contents}
								</a>
							),
						})}
					</p>
				</div>
			</div>
		</div>
	);
}

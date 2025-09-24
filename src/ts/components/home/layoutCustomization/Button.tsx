import { MultiBackend, Tree, getBackendOptions } from "@minoru/react-dnd-treeview";
import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import { DndProvider } from "react-dnd";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	multigetDevelopUniversesByIds,
	type OmniSort,
} from "src/ts/helpers/requests/services/universes";
import IconButton from "../../core/IconButton";
import Toggle from "../../core/Toggle";
import SimpleModal from "../../core/modal/SimpleModal";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import useFeatureValue from "../../hooks/useFeatureValue";
import useStorage from "../../hooks/useStorage";
import SortItem from "./SortItem";
import {
	type CustomHomePlaylist,
	type CustomHomeSortItem,
	HOME_SORTS_LAYOUT_STORAGE_KEY,
	type HomeSortsLayoutStorageValue,
	type Layout,
	type SortWithOverrides,
	type TreeLayout,
} from "./constants";
import { getTreeLayout, type HomeSortingLayoutItemSort, transformState } from "./utils";
import usePromise from "../../hooks/usePromise";
import PlaylistSortExperience from "./PlaylistSortExperience";

export type CustomizeLayoutButtonProps = {
	state: Signal<OmniSort[] | undefined>;
};

export default function CustomizeLayoutButton({ state }: CustomizeLayoutButtonProps) {
	const [playlistsEnabled] = useFeatureValue("customizeHomeSortsLayout.playlists", false);

	const [authenticatedUser] = useAuthenticatedUser();
	const [showModal, _setShowModal] = useState(false);
	const setShowModal = (show: boolean) => {
		_setShowModal(show);

		const url = new URL(location.href);
		const hasParam = url.searchParams.has("advancedCustomization");

		if (show) {
			if (hasParam) return;
			url.searchParams.set("customizeLayout", "true");
		} else {
			url.searchParams.delete("customizeLayout");
		}
		history.replaceState(null, "", url.toString());
	};
	const [storageValue, setStorageValue, storageRef, storageFetched] =
		useStorage<HomeSortsLayoutStorageValue>(HOME_SORTS_LAYOUT_STORAGE_KEY, {});
	const [layout, hasSetLayout] = useMemo(() => {
		const userLayout =
			authenticatedUser?.userId !== undefined
				? storageValue[authenticatedUser.userId]
				: undefined;
		return [
			userLayout ||
				(storageValue.default !== undefined
					? storageValue[storageValue.default]
					: {
							sorts: [],
						}),
			userLayout !== undefined,
		] as [Layout, boolean];
	}, [authenticatedUser?.userId, storageValue, playlistsEnabled]);
	const displayState = useMemo(
		() =>
			state.value &&
			transformState(
				state.value,
				layout,
				playlistsEnabled ? storageRef.current._custom : undefined,
			),
		[state.value, layout, playlistsEnabled],
	);

	const updateLayout = (
		setLayout?: Layout,
		skipRefresh?: boolean,
		skipUpdate?: boolean,
		playlists?: CustomHomePlaylist[],
	) => {
		if (!authenticatedUser?.userId) {
			return;
		}

		const layout =
			setLayout ||
			(storageRef.current.default !== undefined &&
				storageRef.current[storageRef.current.default]) ||
			({
				sorts: getTreeLayout(state.value).map((item) => {
					// should never happen because playlist experiences are not default
					if (item.data.type !== "sort") return {};

					return {
						layoutOverride: {},
						override: {},
						topicId: item.data.sort.topicId,
						typeIndex: item.data.typeIndex,
					};
				}),
			} as Layout);

		const newLayout = {
			...layout,
			sorts: layout.sorts.filter((sort) => {
				let isAtLeastOneCollapsed = false;

				const all: SortWithOverrides[] = [];
				for (const sort2 of layout.sorts) {
					if (sort2.topicId === sort.topicId) {
						all.push(sort2);
						if (sort2.override.collapse) {
							isAtLeastOneCollapsed = true;
						}
					}
				}

				if (isAtLeastOneCollapsed) {
					return all.indexOf(sort) === 0;
				}

				return true;
			}),
		};

		if (!skipRefresh) {
			sendMessage("home.updateSortsLayout", {
				layout,
				playlists: playlistsEnabled ? (playlists ?? storageRef.current._custom) : undefined,
			});
		}

		if (!skipUpdate) {
			// @ts-expect-error: Fine, can undefined it!
			setStorageValue({
				...storageRef.current,
				_custom: playlists ?? storageRef.current._custom,
				default:
					authenticatedUser.userId === storageRef.current.default && !setLayout
						? undefined
						: storageRef.current.default,
				[authenticatedUser.userId]: setLayout !== undefined ? newLayout : undefined,
			});
		}
	};

	const [playlistUniverseData] = usePromise(() => {
		if (!playlistsEnabled || !storageValue._custom || !showModal) return;
		const universeIds: number[] = [];

		for (const customList of storageValue._custom) {
			for (const item of customList.items) {
				universeIds.push(item.id);
			}
		}

		return multigetDevelopUniversesByIds({
			ids: universeIds,
		});
	}, [storageValue, playlistsEnabled, showModal]);

	useDidMountEffect(() => {
		if (authenticatedUser?.userId && storageFetched) {
			if (!layout.sorts.length && state.value) {
				updateLayout(
					{
						sorts: getTreeLayout(state.value).map((item) => {
							// should never happen because playlist experiences are not default
							if (item.data.type !== "sort") return {} as SortWithOverrides;

							return {
								layoutOverride: {},
								override: {},
								topicId: item.data.sort.topicId,
								typeIndex: item.data.typeIndex,
							};
						}),
					},
					true,
				);
			} else if (layout.sorts.length) {
				sendMessage("home.updateSortsLayout", {
					layout,
					playlists: playlistsEnabled ? storageRef.current._custom : undefined,
				});
			}
		}
	}, [state.value, storageFetched, authenticatedUser?.userId]);

	const treeLayout = useMemo(
		() =>
			getTreeLayout(
				displayState,
				playlistsEnabled ? storageRef.current._custom : undefined,
				playlistUniverseData || undefined,
			),
		[displayState, playlistUniverseData],
	);

	const updateFromTreeLayout = (
		newTreeLayout: TreeLayout,
		newPlaylists?: CustomHomePlaylist[],
	) => {
		const newLayout = {
			...layout,

			sorts: newTreeLayout.map((sort) => {
				const oldSort = layout.sorts.find(
					(sort2) =>
						sort2.topicId === sort.sort.topicId && sort2.typeIndex === sort.typeIndex,
				);

				return {
					typeIndex: sort.typeIndex,
					topicId: sort.sort.topicId,
					layoutOverride: oldSort?.layoutOverride ?? {},
					override: oldSort?.override ?? {},
				};
			}),
		};

		updateLayout(newLayout, undefined, undefined, newPlaylists);
	};

	useEffect(() => {
		const search = new URLSearchParams(location.search);
		if (search.get("customizeLayout") === "true") {
			setShowModal(true);
		}
	}, []);

	return (
		<>
			{displayState && (
				<SimpleModal
					title={getMessage("home.customizeLayout.modal.title", {
						sealEmoji: SEAL_EMOJI_COMPONENT,
					})}
					subtitle={getMessage("home.customizeLayout.modal.subtitle")}
					show={showModal}
					onClose={() => {
						setShowModal(false);
					}}
				>
					<div className="customize-home-layout-modal">
						<DndProvider backend={MultiBackend} options={getBackendOptions()}>
							<Tree
								classes={{
									placeholder: "drop-placeholder",
									root: "dnd-sorts-layout rbx-scrollbar roseal-scrollbar",
									container: "dnd-list",
								}}
								sort={false}
								tree={treeLayout}
								rootId={0}
								render={(node, render) => {
									const data = node.data!;

									if (data.type === "experience") {
										return (
											<PlaylistSortExperience
												text={node.text}
												render={render}
												removeFromPlaylist={() => {
													if (!storageValue._custom) {
														return;
													}

													const newCustom = [...storageValue._custom];
													for (let i = 0; i < newCustom.length; i++) {
														const playlist = newCustom[i];
														if (playlist.id === data.playlistId) {
															for (
																let i2 = 0;
																i < playlist.items.length;
																i++
															) {
																if (
																	playlist.items[i2].id ===
																	data.experienceId
																) {
																	playlist.items.splice(i2, 1);
																	i2--;
																	if (
																		playlist.items.length === 0
																	) {
																		newCustom.splice(i, 1);
																		i--;
																	}
																	break;
																}
															}
															break;
														}
													}

													updateLayout(
														layout,
														undefined,
														undefined,
														newCustom,
													);
												}}
											/>
										);
									}

									return (
										<SortItem
											data={data}
											text={node.text}
											render={render}
											sort={{
												topicId: data.sort.topicId,
												typeIndex: data.typeIndex,
												layoutOverride: {},
												override: {},
												...(layout.sorts.find(
													(sort2) =>
														sort2.topicId === data.sort.topicId &&
														sort2.typeIndex === data.typeIndex,
												) ?? {}),
											}}
											updatePlaylist={(playlist) => {
												if (!storageValue._custom) {
													return;
												}

												const newCustom = [...storageValue._custom];
												if (!playlist) {
													newCustom.splice(data.playlistIndex, 1);
												} else {
													newCustom[data.playlistIndex] = playlist;
												}

												updateLayout(
													layout,
													undefined,
													undefined,
													newCustom,
												);
											}}
											playlist={storageValue._custom?.[data.playlistIndex]}
											updateSort={(value) => {
												const newSortLayout: SortWithOverrides[] = [];

												for (const sort of treeLayout) {
													if (sort.data.type === "experience") continue;

													const oldSort = layout.sorts.find(
														(sort2) =>
															sort2.topicId === data.sort.topicId &&
															sort2.typeIndex === data.typeIndex,
													);

													if (
														data.sort.topicId ===
															sort.data.sort.topicId &&
														data.typeIndex === sort.data.typeIndex
													) {
														newSortLayout.push(value);
													} else
														newSortLayout.push({
															typeIndex: sort.data.typeIndex,
															topicId: sort.data.sort.topicId,
															layoutOverride:
																oldSort?.layoutOverride ?? {},
															override: oldSort?.override ?? {},
														});
												}

												updateLayout({
													...layout,
													sorts: newSortLayout,
												});
											}}
										/>
									);
								}}
								onDrop={(data) => {
									const newSortLayout: HomeSortingLayoutItemSort[] = [];
									const newPlaylists: CustomHomePlaylist[] = [];

									const newPlaylistOrder: Record<string, CustomHomeSortItem[]> =
										{};

									for (const item of data) {
										if (!item.data) continue;

										if (item.data.type === "sort") {
											newSortLayout.push(item.data);
										} else if (item.data.type === "experience") {
											newPlaylistOrder[item.data.playlistId] ??= [];
											newPlaylistOrder[item.data.playlistId].push({
												id: item.data.experienceId,
											});
										}
									}

									if (playlistsEnabled && storageRef.current._custom) {
										for (const item of storageRef.current._custom) {
											newPlaylists.push({
												...item,
												items: newPlaylistOrder[item.id] ?? [],
											});
										}
									}

									updateFromTreeLayout(
										newSortLayout,
										playlistsEnabled ? newPlaylists : undefined,
									);
								}}
								canDrop={(_, { dropTarget, dropTargetId, dragSource }) => {
									if (dragSource?.data?.type === "sort") {
										return !dropTargetId;
									}

									return (
										!!dropTargetId &&
										dropTarget?.data?.type === "sort" &&
										dragSource?.data?.playlistDndId === dropTargetId
									);
								}}
								placeholderRender={() => <div className="drop-placeholder-item" />}
							/>
						</DndProvider>
						<div
							className={classNames("configuration-btns", {
								"roseal-disabled": !hasSetLayout,
							})}
						>
							<div
								className="default-toggle"
								onClick={() => {
									setStorageValue({
										...storageValue,
										default:
											storageValue.default === authenticatedUser?.userId
												? undefined
												: authenticatedUser?.userId,
									});
								}}
							>
								<Toggle
									isOn={storageValue.default === authenticatedUser?.userId}
									small
								/>
								<span className="text toggle-label small">
									{getMessage("home.customizeLayout.modal.default")}
								</span>
							</div>
							<div
								className="reset-to-default-btn text-emphasis small"
								onClick={() => {
									updateLayout();
								}}
							>
								{getMessage("home.customizeLayout.modal.resetToDefault")}
							</div>
						</div>
					</div>
				</SimpleModal>
			)}
			<IconButton
				id="customize-home-layout-btn"
				iconName="edit"
				size="sm"
				onClick={() => setShowModal(true)}
				disabled={!displayState?.length}
			>
				<span className="btn-text">{getMessage("home.customizeLayout.buttonText")}</span>
			</IconButton>
		</>
	);
}

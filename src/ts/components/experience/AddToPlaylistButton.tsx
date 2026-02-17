import MdOutlineCheckBox from "@material-symbols/svg-400/outlined/check_box.svg";
import MdOutlineCheckBoxOutlineBlank from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg";
import MdOutlineLibraryAddFilled from "@material-symbols/svg-400/outlined/library_add-fill.svg";
import MdOutlineLibraryAdd from "@material-symbols/svg-400/outlined/library_add.svg";
import MdOutlineLibraryAddCheckFilled from "@material-symbols/svg-400/outlined/library_add_check-fill.svg";
import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../core/Button";
import Popover from "../core/Popover";
import TextInput from "../core/TextInput";
import {
	HOME_SORTS_LAYOUT_STORAGE_KEY,
	type HomeSortsLayoutStorageValue,
	MAX_PLAYLIST_NAME_LENGTH,
} from "../home/layoutCustomization/constants";
import useStorage from "../hooks/useStorage";

export type AddToPlaylistButtonProps = {
	universeId: number;
};

export default function AddToPlaylistButton({ universeId }: AddToPlaylistButtonProps) {
	const [newPlaylistName, setNewPlaylistName] = useState("");
	const [storageValue, setStorageValue, isFetched] = useStorage<HomeSortsLayoutStorageValue>(
		HOME_SORTS_LAYOUT_STORAGE_KEY,
		{},
	);

	const isAdded = useMemo(() => {
		if (!storageValue._custom) {
			return false;
		}

		for (const sort of storageValue._custom) {
			for (const item of sort.items) {
				if (item.id === universeId) {
					return true;
				}
			}
		}

		return false;
	}, [storageValue._custom]);

	const createPlaylist = () => {
		if (!newPlaylistName.length) {
			return;
		}

		setNewPlaylistName("");
		setStorageValue({
			...storageValue,
			_custom: [
				...(storageValue._custom ?? []),
				{
					id: crypto.randomUUID(),
					sortType: "Experiences",
					name: newPlaylistName,
					items: [
						{
							id: universeId,
						},
					],
				},
			],
		});
	};

	return (
		<li
			className={classNames("game-toggle-playlist-button-container", {
				"is-added": isAdded,
				disabled: !isFetched,
			})}
		>
			<Popover
				placement="bottom"
				trigger="click"
				button={
					<div className="toggle-playlist-button-container">
						<button type="button" className="roseal-btn toggle-playlist-button">
							<div className="icon-variants">
								{isAdded ? (
									<MdOutlineLibraryAddCheckFilled className="roseal-icon regular-icon-added" />
								) : (
									<>
										<MdOutlineLibraryAdd className="roseal-icon regular-icon" />
										<MdOutlineLibraryAddFilled className="roseal-icon hover-icon" />
									</>
								)}
							</div>
							<div className="icon-label">
								{getMessage(
									`experience.addToPlaylist.buttonText.${isAdded ? "added" : "add"}`,
								)}
							</div>
						</button>
					</div>
				}
			>
				<div className="add-to-playlist-popover">
					<div className="container-header">
						<h4>{getMessage("experience.addToPlaylist.title")}</h4>
						<p className="small">{getMessage("experience.addToPlaylist.subtitle")}</p>
					</div>
					<div className="container-body">
						{storageValue._custom && storageValue._custom.length > 0 && (
							<ul className="playlist-list roseal-scrollbar">
								{storageValue._custom.map((sort, index) => {
									const addedIndex = sort.items.findIndex(
										(item) => item.id === universeId,
									);
									const isAdded = addedIndex !== -1;

									return (
										<li key={sort.id} className="playlist-item-container">
											<button
												type="button"
												className={classNames("roseal-btn playlist-item", {
													"is-added": isAdded,
												})}
												onClick={() => {
													const newItems = [...sort.items];
													if (!isAdded) {
														newItems.push({ id: universeId });
													} else {
														newItems.splice(addedIndex, 1);
													}

													if (newItems.length === 0) {
														storageValue._custom!.splice(index, 1);
													} else {
														sort.items = newItems;
													}

													setStorageValue({
														...storageValue,
													});
												}}
											>
												<div className="playlist-title text-overflow">
													{sort.name}
												</div>
												<div
													className={classNames("playlist-add-icon", {
														"is-added": isAdded,
													})}
												>
													{isAdded ? (
														<MdOutlineCheckBox className="roseal-icon" />
													) : (
														<MdOutlineCheckBoxOutlineBlank className="roseal-icon" />
													)}
												</div>
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</div>
					<div className="create-playlist-container">
						<div className="container-header">
							<span className="font-bold">
								{getMessage("experience.addToPlaylist.createPlaylist.title")}
							</span>
						</div>
						<div className="playlist-name-container">
							<TextInput
								className="playlist-name-input"
								placeholder={getMessage(
									"experience.addToPlaylist.createPlaylist.namePlaceholder",
								)}
								onEnter={createPlaylist}
								onType={setNewPlaylistName}
								value={newPlaylistName}
								minLength={1}
								maxLength={MAX_PLAYLIST_NAME_LENGTH}
							/>
							<Button
								type="secondary"
								disabled={newPlaylistName.length === 0}
								onClick={createPlaylist}
							>
								{getMessage("experience.addToPlaylist.createPlaylist.buttonText")}
							</Button>
						</div>
					</div>
				</div>
			</Popover>
		</li>
	);
}

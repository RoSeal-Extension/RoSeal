import type { RenderParams } from "@minoru/react-dnd-treeview";
import classNames from "classnames";
import MdOutlineDelete from "@material-symbols/svg-400/outlined/delete-fill.svg";

export type PlaylistSortExperienceProps = {
	text: string;
	render: RenderParams;
	removeFromPlaylist: () => void;
};

export default function PlaylistSortExperience({
	text,
	render,
	removeFromPlaylist,
}: PlaylistSortExperienceProps) {
	return (
		<div
			className={classNames("sort-item playlist-item", {
				"is-dragging": render.isDragging,
			})}
		>
			<button
				type="button"
				className="btn-generic-more-sm delete-playlist-item-btn"
				onClick={removeFromPlaylist}
			>
				<MdOutlineDelete className="roseal-icon" />
			</button>
			<div className="sort-item-text">
				<span className="sort-text">{text}</span>
			</div>
		</div>
	);
}

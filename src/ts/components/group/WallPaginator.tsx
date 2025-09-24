import { useState } from "preact/hooks";
import { invokeMessage, sendMessage } from "src/ts/helpers/communication/dom.ts";
import Pagination from "../core/Pagination.tsx";
import usePromise from "../hooks/usePromise.ts";

export default function GroupWallPaginator() {
	const [pageNumber, setPageNumber] = useState(1);
	const [isNotBusy] = usePromise(
		() => invokeMessage("group.wall.onReady", undefined),
		[pageNumber],
	);
	const [canLoadNextPage] = usePromise(
		() => invokeMessage("group.wall.canLoadNextPage", undefined),
		[isNotBusy, pageNumber],
	);

	return (
		<>
			{(canLoadNextPage || pageNumber > 1) && (
				<Pagination
					id="group-wall-paginator"
					current={pageNumber}
					hasNext={canLoadNextPage === true}
					onChange={(newPageNumber) => {
						sendMessage("group.wall.paginate", newPageNumber > pageNumber);
						setPageNumber(newPageNumber);
					}}
					disabled={isNotBusy !== true}
				/>
			)}
		</>
	);
}

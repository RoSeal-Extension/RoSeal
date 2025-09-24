import { FRIEND_TILE_WIDTH } from "../constants/friends";

export function calculateFriendsCarouselNewOffsetWidth(el: HTMLDivElement, rows: number) {
	const style = getComputedStyle(el);
	const paddingLeft = Number.parseInt(style.paddingLeft, 10);
	const paddingRight = Number.parseInt(style.paddingRight, 10);

	const offsetWidth = el.getBoundingClientRect().width - paddingLeft - paddingRight;

	const totalGap = offsetWidth % FRIEND_TILE_WIDTH;
	const oneRowTotalItemLength = Math.floor(offsetWidth / FRIEND_TILE_WIDTH);

	el.style.setProperty("--gap", `${totalGap / oneRowTotalItemLength}px`);

	return oneRowTotalItemLength * FRIEND_TILE_WIDTH * rows;
}

import type { ThumbnailFormat } from "../helpers/requests/services/thumbnails";
import { getRobloxCDNUrl } from "./baseUrls" with { type: "macro" };

export type ThumbnailModifier = "isCircular" | "noFilter" | "cropToAspectRatio";

export type GetThumbnailUrlOptions = {
	hash: string;
	width: number;
	height: number;
	type: string;
	format?: ThumbnailFormat;
	modifier?: ThumbnailModifier;
};

export function getResizeThumbnailUrl({
	hash,
	width,
	height,
	type,
	format = "Png",
	modifier = "noFilter",
}: GetThumbnailUrlOptions): string {
	return `https://${getRobloxCDNUrl("tr")}/${hash}/${width}/${height}/${type}/${format}/${modifier}`;
}

export type SupportedThumbnailSizes =
	| [30, 30]
	| [42, 42]
	| [48, 48]
	| [50, 50]
	| [60, 60]
	| [60, 62]
	| [75, 75]
	| [100, 100]
	| [110, 110]
	| [128, 128]
	| [140, 140]
	| [150, 150]
	| [150, 200]
	| [160, 100]
	| [160, 600]
	| [180, 180]
	| [250, 250]
	| [256, 144]
	| [256, 256]
	| [300, 250]
	| [304, 166]
	| [352, 352]
	| [384, 216]
	| [396, 216]
	| [420, 420]
	| [480, 270]
	| [512, 512]
	| [576, 324]
	| [700, 700]
	| [720, 720]
	| [728, 90]
	| [768, 432]
	| [1200, 80]
	| [330, 110]
	| [660, 220]
	| [1320, 440]
	| [720, 228]
	| [1440, 456];

export const thumbnailSizeMap: Record<string, Record<string, { width: number; height: number }>> = {
	// 1:1
	"30x30": {
		high: {
			width: 60,
			height: 60,
		},
		highest: {
			width: 128,
			height: 128,
		},
	},
	// 1:1
	"42x42": {
		lowest: {
			width: 30,
			height: 30,
		},
		high: {
			width: 128,
			height: 128,
		},
		highest: {
			width: 256,
			height: 256,
		},
	},
	// 1:1
	"48x48": {
		lowest: {
			width: 30,
			height: 30,
		},
		low: {
			width: 42,
			height: 42,
		},
		high: {
			width: 128,
			height: 128,
		},
		highest: {
			width: 256,
			height: 256,
		},
	},
	// 1:1
	"50x50": {
		lowest: {
			width: 30,
			height: 30,
		},
		low: {
			width: 42,
			height: 42,
		},
		high: {
			width: 128,
			height: 128,
		},
		highest: {
			width: 256,
			height: 256,
		},
	},
	// 1:1
	"60x60": {
		lowest: {
			height: 42,
			width: 42,
		},
		low: {
			width: 50,
			height: 50,
		},
		high: {
			width: 128,
			height: 128,
		},
		highest: {
			width: 256,
			height: 256,
		},
	},
	// 30:31
	//"60x62": {},
	// 1:1
	"75x75": {
		lowest: {
			height: 42,
			width: 42,
		},
		low: {
			width: 50,
			height: 50,
		},
		high: {
			width: 180,
			height: 180,
		},
		highest: {
			width: 352,
			height: 352,
		},
	},
	// 1:1
	"100x100": {
		lowest: {
			width: 50,
			height: 50,
		},
		low: {
			width: 60,
			height: 60,
		},
		high: {
			width: 180,
			height: 180,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 1:1
	"110x110": {
		lowest: {
			width: 50,
			height: 50,
		},
		low: {
			width: 60,
			height: 60,
		},
		high: {
			width: 256,
			height: 256,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 1:1
	"128x128": {
		lowest: {
			width: 50,
			height: 50,
		},
		low: {
			width: 75,
			height: 75,
		},
		high: {
			width: 256,
			height: 256,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 1:1
	"140x140": {
		lowest: {
			width: 60,
			height: 60,
		},
		low: {
			width: 100,
			height: 100,
		},
		high: {
			width: 256,
			height: 256,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 1:1
	"150x150": {
		lowest: {
			width: 60,
			height: 60,
		},
		low: {
			width: 100,
			height: 100,
		},
		high: {
			width: 256,
			height: 256,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 3:4
	//"150x200": {},
	// 8:5
	//"160x100": {},
	// 4:15
	//"160x600": {},
	// 1:1
	"180x180": {
		lowest: {
			width: 75,
			height: 75,
		},
		low: {
			width: 100,
			height: 100,
		},
		high: {
			width: 352,
			height: 352,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 9:16
	"180x320": {
		lowest: {
			width: 256,
			height: 144,
		},
		highest: {
			width: 1224,
			height: 732,
		},
	},
	// 1:1
	"250x250": {
		lowest: {
			width: 75,
			height: 75,
		},
		low: {
			width: 150,
			height: 150,
		},
		high: {
			width: 352,
			height: 352,
		},
		highest: {
			width: 512,
			height: 512,
		},
	},
	// 16:9
	"256x144": {
		high: {
			width: 576,
			height: 324,
		},
		highest: {
			height: 768,
			width: 432,
		},
	},
	// 1:1
	"256x256": {
		lowest: {
			width: 100,
			height: 100,
		},
		low: {
			width: 150,
			height: 150,
		},
		high: {
			width: 352,
			height: 352,
		},
		highest: {
			width: 720,
			height: 720,
		},
	},
	// 6:5
	//"300x250": {},
	// 20:11
	//"304x166": {},
	// 1:1
	"352x352": {
		lowest: {
			width: 100,
			height: 100,
		},
		low: {
			width: 180,
			height: 180,
		},
		high: {
			width: 512,
			height: 512,
		},
		highest: {
			width: 720,
			height: 720,
		},
	},
	// 16:9
	"384x216": {
		lowest: {
			width: 256,
			height: 144,
		},
		low: {
			width: 256,
			height: 144,
		},
		high: {
			width: 576,
			height: 324,
		},
		highest: {
			width: 768,
			height: 432,
		},
	},
	// 11:6
	//"396x216": {},
	// 1:1
	"420x420": {
		lowest: {
			width: 150,
			height: 150,
		},
		low: {
			width: 256,
			height: 256,
		},
		high: {
			width: 512,
			height: 512,
		},
		highest: {
			width: 720,
			height: 720,
		},
	},
	// 16:9
	"480x270": {
		lowest: {
			width: 256,
			height: 144,
		},
		low: {
			width: 384,
			height: 216,
		},
		high: {
			width: 576,
			height: 324,
		},
		highest: {
			width: 768,
			height: 432,
		},
	},
	// 1:1
	"512x512": {
		lowest: {
			width: 256,
			height: 256,
		},
		low: {
			width: 352,
			height: 352,
		},
		highest: {
			width: 720,
			height: 720,
		},
	},
	// 16:9
	"576x324": {
		lowest: {
			width: 256,
			height: 144,
		},
		low: {
			width: 384,
			height: 216,
		},
		highest: {
			width: 768,
			height: 432,
		},
	},
	// 1:1
	"700x700": {
		lowest: {
			width: 352,
			height: 352,
		},
		low: {
			width: 512,
			height: 512,
		},
		highest: {
			width: 720,
			height: 720,
		},
	},
	// 1:1
	"720x720": {
		lowest: {
			width: 352,
			height: 352,
		},
		low: {
			width: 512,
			height: 512,
		},
	},
	// 8:1
	//"728x90": {},
	// 16:9
	"768x432": {
		lowest: {
			width: 256,
			height: 144,
		},
		low: {
			width: 480,
			height: 270,
		},
	},
	// 9:16
	"1224x732": {
		low: {
			width: 180,
			height: 320,
		},
		lowest: {
			width: 256,
			height: 144,
		},
	},

	// 15:1
	//"1200x80": {},
};
export function parseResizeThumbnailUrl(_url: string): GetThumbnailUrlOptions | null {
	try {
		const url = new URL(_url);
		if (url.hostname !== getRobloxCDNUrl("tr")) {
			return null;
		}

		const path = url.pathname.split("/");
		if (path.length !== 7) {
			return null;
		}

		return {
			hash: path[1],
			width: Number.parseInt(path[2], 10),
			height: Number.parseInt(path[3], 10),
			type: path[4],
			format: path[5] as ThumbnailFormat,
			modifier: (path[6] as ThumbnailModifier) ?? "noFilter",
		};
	} catch {
		return null;
	}
}

export function parseCDNThumbnailUrl(_url: string): string | null {
	try {
		const url = new URL(_url);
		if (!url.hostname.endsWith(getRobloxCDNUrl(""))) {
			return null;
		}

		const path = url.pathname.split("/");

		return path[1] ?? null;
	} catch {
		return null;
	}
}

export function getHashUrl(hash: string, type = "t") {
	let st = 31;
	for (let ii = 0; ii < hash.length; ii++) {
		st ^= hash[ii].charCodeAt(0);
	}

	return `https://${type}${(st % 8).toString()}${getRobloxCDNUrl("")}/${hash}`;
}

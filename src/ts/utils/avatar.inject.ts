import { downloadZip } from "client-zip";
import { httpClient } from "../helpers/requests/main";
import { getUser3dThumbnail } from "../helpers/requests/services/thumbnails";
import { getHashUrl } from "./thumbnails";

type FileToFetch = {
	name: string;
	url: string;
};

type Thumbnail3DData = {
	mtl: string;
	obj: string;
	textures: string[];
};

export async function getUser3dThumbnailDownloadData(userId: number) {
	while (true) {
		const threeDeeData = await getUser3dThumbnail({
			userId,
		});

		if (threeDeeData.state === "Pending") continue;
		if (!threeDeeData.imageUrl) return;

		const data = (
			await httpClient.httpRequest<Thumbnail3DData>({
				url: threeDeeData.imageUrl,
			})
		).body;

		const filesToFetch: FileToFetch[] = [];

		filesToFetch.push({
			name: "mtl.mtl",
			url: getHashUrl(data.mtl, "t"),
		});

		filesToFetch.push({
			name: "obj.obj",
			url: getHashUrl(data.obj, "t"),
		});

		for (let i = 0; i < data.textures.length; i++) {
			filesToFetch.push({
				name: `texture_${i + 1}.png`,
				url: getHashUrl(data.textures[i], "t"),
			});
		}

		const zip = await downloadZip(
			await Promise.all(
				filesToFetch.map((file) =>
					httpClient
						.httpRequest<ArrayBuffer>({
							url: file.url,
							expect: "arrayBuffer",
						})
						.then((data) => ({
							name: file.name,
							lastModified: new Date(),
							input: data.body,
						})),
				),
			),
		).blob();

		return URL.createObjectURL(zip);
	}
}

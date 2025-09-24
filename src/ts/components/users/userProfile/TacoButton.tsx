import { useCallback, useState } from "preact/hooks";
import { TACO_EMOJI_CODE } from "src/ts/constants/misc";
import { assetDeliveryProcessor } from "src/ts/helpers/processors/assetDeliveryProcessor";
import { sealRain } from "src/ts/utils/fun/sealRain";
import Button from "../../core/Button";
import { httpClient } from "src/ts/helpers/requests/main";

export type TacoButtonProps = {
	audioAssetId: number;
};

export default function TacoButton({ audioAssetId }: TacoButtonProps) {
	const [clicked, setClicked] = useState(false);
	const [count, setCount] = useState(1);
	const play = useCallback(
		() =>
			assetDeliveryProcessor
				.request({
					assetId: audioAssetId,
				})
				.then(async (data) => {
					const location = data.locations?.[0].location;
					if (!location) return;

					const buffer = (
						await httpClient.httpRequest<ArrayBuffer>({
							url: location,
							expect: "arrayBuffer",
						})
					).body;
					const blob = new Blob([buffer], { type: "audio/wav" });
					const blobUrl = URL.createObjectURL(blob);
					const audio = new Audio();
					audio.src = blobUrl;

					audio.addEventListener("ended", () => {
						audio.currentTime = 0;
						audio.play();
					});
					document.body.appendChild(audio);

					return audio.play().then(() => {
						URL.revokeObjectURL(blobUrl);
						sealRain(5000, TACO_EMOJI_CODE);
					});
				}),
		[],
	);

	return (
		<div className="btn-taco">
			<Button
				type="control"
				width="default"
				disabled={clicked}
				onClick={() => {
					setClicked(true);
					const interval = setInterval(() => {
						setCount((count) => {
							if (count >= 5) {
								return 1;
							}

							return count + 1;
						});
					}, 250);

					play().then(() => {
						clearInterval(interval);
						setCount(1);
					});
				}}
			>
				{TACO_EMOJI_CODE.repeat(count)}
			</Button>
		</div>
	);
}

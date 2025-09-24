import { useState, useEffect } from "preact/hooks";
import Confetti from "react-confetti";
import { randomInt } from "../random";
import { renderAppendBody } from "../render";
import { SEAL_EMOJI_CODE } from "src/ts/constants/misc";

export function getSealRainSeals() {
	return randomInt(2, 12_000);
}

export type SealRainProps = {
	seals: number;
	emoji?: string;
	recycle?: boolean;
};

export function SealRain({ seals, emoji, recycle = true }: SealRainProps) {
	const [width, setWidth] = useState(window.innerWidth);
	const [height, setHeight] = useState(
		Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
	);

	useEffect(() => {
		const listener = () => {
			setWidth(window.innerWidth);
			setHeight(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
		};

		globalThis.addEventListener("resize", listener);
		return () => globalThis.removeEventListener("resize", listener);
	}, []);

	return (
		<Confetti
			width={width}
			height={height}
			recycle={recycle}
			numberOfPieces={Math.round((seals ?? getSealRainSeals()) / 20)}
			// biome-ignore lint/suspicious/noExplicitAny: No idea tbh
			drawShape={function (this: any, ctx: CanvasRenderingContext2D) {
				if (!this.sealSize) {
					this.sealSize = Math.random() < 0.999 ? randomInt(40, 100) : 200;
					this.angularSpin = 0;
					this.angle = 0;
					this.rotateY = 1;
					ctx.rotate = () => {};
					ctx.scale = () => {};
				}

				ctx.font = `${this.sealSize}px serif`;
				ctx.fillText(emoji ?? SEAL_EMOJI_CODE, 0, 0, 500);
			}}
		/>
	);
}

export function sealRain(seals?: number, emoji?: string, recycle = true) {
	renderAppendBody(
		<SealRain seals={seals ?? getSealRainSeals()} emoji={emoji} recycle={recycle} />,
	);
}

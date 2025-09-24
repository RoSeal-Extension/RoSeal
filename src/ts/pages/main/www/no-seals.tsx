import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import Button from "src/ts/components/core/Button.tsx";
import Icon from "src/ts/components/core/Icon.tsx";
import SimpleModal from "src/ts/components/core/modal/SimpleModal.tsx";
import { watchOnce } from "src/ts/helpers/elements.ts";
import type { Page } from "src/ts/helpers/pages/handleMainPages.ts";
import { NO_SEALS_REGEX } from "src/ts/utils/regex";

function NoSeals() {
	const [time, setTime] = useState(0);
	const [modalOpen, setModalOpen] = useState(false);
	const [showButton, setShowButton] = useState(true);
	const [hasSeals, setHasSeals] = useState(false);

	useEffect(() => {
		if (modalOpen) {
			if (!time) {
				setModalOpen(false);
				setShowButton(false);
			} else {
				const timeout = setTimeout(() => setTime(time - 1), 1000);
				return () => clearTimeout(timeout);
			}
		}
	}, [time]);

	return (
		<div className="text-center">
			{!hasSeals && (
				<div>
					<div className="no-seals-title">
						<h1>No Seals</h1>
					</div>
					<div className="no-seals-error">
						<Icon name="spot-error" size="2xl" />
						<div className="error-text text-label">
							Try again when you have some seals
						</div>
					</div>
				</div>
			)}
			{showButton && (
				<>
					<br />
					<Button
						onClick={() => {
							setTime(10);
							setModalOpen(true);
						}}
					>
						Get Seals
					</Button>
				</>
			)}
			{hasSeals && <div>{"🦭".repeat(1000)}</div>}
			<SimpleModal
				size="sm"
				show={modalOpen}
				title="Would you like to get Seals?"
				centerBody
				footer="This may never show again."
				buttons={[
					{
						type: "neutral",
						text: "NOT POSSIBLE",
						disabled: true,
						onClick: () => {
							setModalOpen(false);
							setShowButton(false);
						},
					},
					{
						type: "action",
						text: "Get Seals",
						onClick: () => {
							setModalOpen(false);
							setShowButton(false);
							setHasSeals(true);
						},
					},
				]}
				closeable={false}
			>
				You have {time} seconds.
			</SimpleModal>
		</div>
	);
}

export default {
	id: "noSeals",
	isCustomPage: true,
	regex: [NO_SEALS_REGEX],
	featureIds: ["sealsPages"],
	fn: () => {
		watchOnce(".content").then((content) => render(<NoSeals />, content));
	},
} satisfies Page;

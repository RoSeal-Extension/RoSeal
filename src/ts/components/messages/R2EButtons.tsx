import { useState } from "preact/hooks";
import Button from "../core/Button.tsx";
import type { Signal } from "@preact/signals";
import {
	listPrivateMessages,
	markPrivateMessagesRead,
	type PrivateMessage,
} from "src/ts/helpers/requests/services/privateMessages.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import SimpleModal from "../core/modal/SimpleModal.tsx";
import { getCreatorDocsLink } from "src/ts/utils/links.ts";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact.tsx";

async function listAllPrivateMessages(pageSize = 20): Promise<PrivateMessage[]> {
	let pageNumber = 0;
	const list: PrivateMessage[] = [];
	while (true) {
		const { collection, totalPages } = await listPrivateMessages({ pageNumber, pageSize });

		list.push(...collection);
		if (totalPages === pageNumber + 1) {
			return list;
		}

		pageNumber++;
	}
}

export type R2EButtonsProps = {
	state: Signal<{
		pending: boolean;
		downloadString: string | undefined;
		hasError: boolean;
		messageIds: number[];
	}>;
};

export default function R2EButtons({ state }: R2EButtonsProps) {
	const [showModal, setShowModal] = useState(false);
	const [modalLoading, setModalLoading] = useState(false);

	return (
		<>
			<SimpleModal
				show={showModal}
				size="sm"
				title={getMessage("messages.r2eButton.modal.title", {
					sealEmoji: SEAL_EMOJI_COMPONENT,
				})}
				buttons={[
					{
						text: getMessage("messages.r2eButton.modal.neutral"),
						type: "neutral",
						onClick: () => {
							setShowModal(false);
						},
						disabled: modalLoading,
					},
					{
						text: getMessage("messages.r2eButton.modal.action"),
						type: "action",
						onClick: () => {
							setModalLoading(true);
							markPrivateMessagesRead({
								messageIds: state.value.messageIds,
							}).finally(() => {
								setModalLoading(false);
								setShowModal(false);
							});
						},
						loading: modalLoading,
					},
				]}
				centerBody
				footer={getMessage("messages.r2eButton.modal.footer", {
					docsLink: (contents: string) => (
						<a
							href={getCreatorDocsLink("cloud", "webhooks/automate-right-to-erasure")}
							className="text-link"
							target="_blank"
							rel="noreferrer"
						>
							{contents}
						</a>
					),
				})}
			>
				<div className="r2e-modal">
					<div className="r2e-read-text">
						{getMessage("messages.r2eButton.modal.body")}
					</div>
				</div>
			</SimpleModal>
			<Button
				className="roseal-requestR2e"
				size="sm"
				type="control"
				disabled={state.value.pending || state.value.hasError}
				as="a"
				onClick={() => {
					if (state.value.downloadString) {
						if (state.value.messageIds.length) {
							setShowModal(true);
						}

						return;
					}

					state.value = {
						...state.value,
						pending: true,
					};
					listAllPrivateMessages()
						.then((collection) => {
							const placeIdToUserIds = new Map<number, Set<number>>();
							let csvValue = "Place ID,User IDs";

							for (const message of collection) {
								if (message.isSystemMessage && !message.isRead) {
									const userIds = [
										...message.body.matchAll(/<strong>(\d+)<\/strong>/g),
									].map((match) => Number.parseInt(match[1], 10));
									const placeIds = [
										...message.body.matchAll(/games\/(\d+)"/g),
									].map((match) => Number.parseInt(match[1], 10));

									if (userIds.length && placeIds.length) {
										// We do not want state to re-render anything yet
										state.value.messageIds.push(message.id);
										for (const placeId of placeIds) {
											const userIdsSet =
												placeIdToUserIds.get(placeId) || new Set();
											for (const userId of userIds) {
												userIdsSet.add(userId);
											}

											placeIdToUserIds.set(placeId, userIdsSet);
										}
									}
								}
							}

							for (const [placeId, userIds] of placeIdToUserIds.entries()) {
								csvValue = `${csvValue}\n${placeId},"${[...userIds].join(",")}"`;
							}

							state.value = {
								...state.value,
								pending: false,
								downloadString: `data:text/csv;base64,${btoa(csvValue)}`,
							};
						})
						.catch(() => {
							state.value = {
								...state.value,
								pending: false,
								hasError: true,
							};
						});
				}}
				href={state.value.downloadString}
				download={!!state.value.downloadString}
			>
				{getMessage(
					`messages.r2eButton.${
						state.value.pending
							? "pending"
							: state.value.hasError
								? "error"
								: state.value.downloadString
									? "download"
									: "request"
					}`,
				)}
			</Button>
			{state.value.downloadString && (
				<Button
					className="roseal-markR2eRead"
					size="sm"
					type="control"
					disabled={!state.value.messageIds.length}
					onClick={() => setShowModal(true)}
				>
					{getMessage("messages.r2eButton.markRead")}
				</Button>
			)}
		</>
	);
}

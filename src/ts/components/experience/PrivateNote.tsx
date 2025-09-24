import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import IconButton from "../core/IconButton.tsx";
import Button from "../core/Button.tsx";
import MentionLinkify from "../core/MentionLinkify.tsx";
import Linkify from "../core/Linkify.tsx";
import ToggleTarget from "../core/ToggleTarget.tsx";
import useFeatureValue from "../hooks/useFeatureValue.ts";
import useStorage from "../hooks/useStorage.ts";
import { MAX_PRIVATE_NOTE_LENGTH, PRIVATE_NOTE_STORAGE_KEY } from "src/ts/constants/experiences.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";

export type ExperiencePrivateNoteProps = {
	universeId: number;
};

export default function ExperiencePrivateNote({ universeId }: ExperiencePrivateNoteProps) {
	const [content, setContent] = useState("");
	const [editing, setEditing] = useState(false);
	const [isItemMentionsEnabled] = useFeatureValue("formatItemMentions", false);
	const [storage, setStorage, , storageFetched] = useStorage<Record<number, string | undefined>>(
		PRIVATE_NOTE_STORAGE_KEY,
		{},
	);

	useEffect(() => {
		if (storage[universeId]) {
			setContent(storage[universeId]);
		}
	}, [storage[universeId]]);

	const [textAreaValue, setTextAreaValue] = useState("");

	return (
		<div
			className={classNames("section private-note-section", {
				"border-bottom": content.length > 0 && !editing,
			})}
		>
			<div
				className={classNames("container-header", {
					"container-header-no-margin": content.length > 0,
				})}
			>
				<h2>{getMessage("experience.privateNotes.title")}</h2>
				{!editing && storageFetched && (
					<IconButton
						iconName="edit"
						size="sm"
						onClick={() => {
							setEditing(true);
						}}
					/>
				)}
			</div>
			{(editing || content.length > 0) && (
				<div className="section-content remove-panel">
					{editing ? (
						<div className="form-group form-has-feedback">
							<textarea
								className="form-control input-field"
								placeholder={getMessage("experience.privateNotes.placeholder")}
								rows={4}
								maxLength={MAX_PRIVATE_NOTE_LENGTH}
								onChange={(e) =>
									setTextAreaValue((e.target as HTMLTextAreaElement).value)
								}
							>
								{content}
							</textarea>
							<div className="note-event">
								<span className="small text">
									{getMessage("experience.privateNotes.footer")}
								</span>
								<p className="form-control-label">
									{getMessage("experience.privateNotes.length", {
										length: asLocaleString(textAreaValue.length),
										maxLength: asLocaleString(MAX_PRIVATE_NOTE_LENGTH),
									})}
								</p>
							</div>
							<div className="note-buttons">
								<Button
									type="secondary"
									width="min"
									onClick={() => {
										setEditing(false);
										setTextAreaValue("");
									}}
								>
									{getMessage("experience.privateNotes.cancel")}
								</Button>
								<Button
									type="primary"
									width="min"
									onClick={() => {
										setEditing(false);
										setContent(textAreaValue);
										setStorage({
											...storage,
											// remove it if it's empty
											[universeId]: textAreaValue || undefined,
										}).finally(() => setTextAreaValue(""));
									}}
								>
									{getMessage("experience.privateNotes.save")}
								</Button>
							</div>
						</div>
					) : (
						<ToggleTarget className="text">
							{isItemMentionsEnabled ? (
								<MentionLinkify key="mention" content={content} />
							) : (
								<Linkify content={content} key="regular" />
							)}
						</ToggleTarget>
					)}
				</div>
			)}
		</div>
	);
}

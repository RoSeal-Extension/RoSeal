import { useEffect, useState } from "preact/hooks";
import FileUploadBox from "src/ts/components/core/FileUploadBox";
import SimpleModal from "src/ts/components/core/modal/SimpleModal";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import type { PrivateServerLinkData } from "src/ts/constants/privateServerLinks";
import { zPrivateServersFile } from "src/ts/constants/privateServerLinks_zod";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getPrivateServerStatusByCode } from "src/ts/helpers/requests/services/privateServers";
import { resolveShareLink } from "src/ts/helpers/requests/services/sharelinks";

export type ImportServerLinksModalProps = {
	show: boolean;
	hide: () => void;
	placeId: number;
	placeName: string;
	universeId: number;
	servers: PrivateServerLinkData[];
	addPrivateServers: (privateServer: PrivateServerLinkData[]) => void;
};

export default function ImportServerLinksModal({
	show,
	hide,
	placeId,
	placeName,
	universeId,
	servers,
	addPrivateServers,
}: ImportServerLinksModalProps) {
	const [importDisabled, setImportDisabled] = useState(false);
	const [importError, setImportError] = useState<string>();
	const [importLoading, setImportLoading] = useState(false);
	const [importFiltered, setImportFiltered] = useState(0);
	const [dataToImport, setDataToImport] = useState<PrivateServerLinkData[]>();

	useEffect(() => {
		if (show) {
			setImportError(undefined);
			setImportLoading(false);
			setImportDisabled(false);
			setImportFiltered(0);
			setDataToImport(undefined);
		}
	}, [show]);

	const handleFileData = (file: File) => {
		setImportLoading(true);

		file.arrayBuffer()
			.then((data) => {
				try {
					const json = JSON.parse(new TextDecoder().decode(data));

					return zPrivateServersFile.safeParseAsync(json).then((read) => {
						if (read.success) {
							const readFilteredData = read.data.data.filter(
								(item, index) =>
									!servers.find((item2) => item2.linkCode === item.linkCode) &&
									read.data.data.findIndex(
										(item2) => item2.linkCode === item.linkCode,
									) === index,
							);
							if (!readFilteredData.length) {
								return setImportError(
									getMessage(
										"experience.privateServerLinks.importPrivateServersModal.importError.allDuplicate",
									),
								);
							}
							return Promise.all(
								readFilteredData.map((item) =>
									item.linkCodeVariant !== 2
										? getPrivateServerStatusByCode({
												placeId,
												placeName,
												privateServerLinkCode: item.linkCode,
											})
										: resolveShareLink({
												linkType: "Server",
												linkId: item.linkCode,
											})
												.then((data) => ({
													valid:
														data.privateServerInviteData?.universeId ===
														universeId,
												}))
												.catch(() => ({
													valid: false,
												})),
								),
							)
								.then((data) => {
									const filtered = [];
									for (const [index, item] of data.entries()) {
										if (item.valid) {
											filtered.push(readFilteredData[index]);
										}
									}

									if (filtered.length === 0) {
										return setImportError(
											getMessage(
												"experience.privateServerLinks.importPrivateServersModal.importError.allInvalid",
											),
										);
									}

									if (filtered.length < read.data.data.length) {
										setImportFiltered(read.data.data.length - filtered.length);
									}

									setDataToImport(filtered);
								})
								.catch(() => {
									setImportError(
										getMessage(
											"experience.privateServerLinks.importPrivateServersModal.importError.unknownCheck",
										),
									);
								});
						}

						setImportError(
							getMessage(
								"experience.privateServerLinks.importPrivateServersModal.importError.invalidFormat",
							),
						);
					});
				} catch {
					setImportError(
						getMessage(
							"experience.privateServerLinks.importPrivateServersModal.importError.invalid",
						),
					);
				}
			})
			.catch(() => {
				setImportError(
					getMessage(
						"experience.privateServerLinks.importPrivateServersModal.importError.unknown",
					),
				);
			})
			.finally(() => {
				setImportLoading(false);
				setImportDisabled(false);
			});
	};

	return (
		<SimpleModal
			size="sm"
			show={show}
			centerTitle
			title={getMessage("experience.privateServerLinks.importPrivateServersModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			dialogClassName="import-server-links-modal"
			centerBody={!!dataToImport}
			buttons={[
				{
					type: "neutral",
					text: getMessage(
						"experience.privateServerLinks.importPrivateServersModal.actions.neutral",
					),
					onClick: hide,
				},
				{
					type: "action",
					disabled: !dataToImport || importDisabled,
					loading: importLoading,
					text: getMessage(
						"experience.privateServerLinks.importPrivateServersModal.actions.action",
					),
					onClick: () => {
						if (dataToImport) {
							addPrivateServers(dataToImport);
						}
						hide();
					},
				},
			]}
		>
			{dataToImport ? (
				<>
					{importFiltered > 0 && (
						<div className="filtered-servers-count">
							{getMessage(
								"experience.privateServerLinks.importPrivateServersModal.filteredCount",
								{
									filtered: importFiltered,
									total: dataToImport.length + importFiltered,
								},
							)}
						</div>
					)}
					<div>
						{getMessage(
							"experience.privateServerLinks.importPrivateServersModal.importInfo",
							{
								total: dataToImport.length,
							},
						)}
						<ul className="import-server-list roseal-scrollbar">
							{dataToImport.map((item) => (
								<li className="font-caption-body" key={item.linkCode}>
									{item.name || "\u00A0"}
								</li>
							))}
						</ul>
					</div>
				</>
			) : (
				<>
					<FileUploadBox
						format=".json"
						disabled={importDisabled}
						slim
						handleFileData={(file) => {
							if (file.name.endsWith(".json")) {
								setImportError(undefined);
								setImportDisabled(true);
								handleFileData(file);
							} else {
								setImportError(
									getMessage(
										"experience.privateServerLinks.importPrivateServersModal.importError.invalid",
									),
								);
							}
						}}
					/>
					{importError && <div className="text-center text-error">{importError}</div>}
				</>
			)}
		</SimpleModal>
	);
}

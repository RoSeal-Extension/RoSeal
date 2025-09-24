import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import { invokeMessage } from "src/ts/helpers/communication/background";
import Icon from "../../components/core/Icon";
import Toggle from "../../components/core/Toggle";
import Tooltip from "../../components/core/Tooltip";
import useHasPermissions from "../../components/hooks/useHasPermissions";
import { addMessageListener } from "../../helpers/communication/dom";
import type {
	AnyFeature,
	Feature,
	FeaturePermissionPermission,
	FeaturePermissions as Permissions,
} from "../../helpers/features/featuresData";
import { getMessage, hasMessage } from "../../helpers/i18n/getMessage";

export type FeaturePermissionProps = {
	featureId: string;
	showError?: boolean;
} & (
	| {
			type: "origin";
			value: string;
	  }
	| {
			type: "permission";
			value: FeaturePermissionPermission;
	  }
);

function FeaturePermission({ featureId, showError, type, value }: FeaturePermissionProps) {
	const permissions = type === "origin" ? { origins: [value] } : { permissions: [value] };
	const hasPermission = useHasPermissions(permissions);
	const tooltipTextKey = `featurePermissions.features.${featureId}.${value}.tooltip`;

	return (
		<li className="feature-permission">
			<Toggle
				small
				isOn={hasPermission}
				onToggle={(isOn) => {
					if (import.meta.env.TARGET_BASE === "firefox") {
						return invokeMessage("openOptionsPage", undefined).then(() => {
							// timeout so the options page can load
							setTimeout(
								() =>
									invokeMessage("requestPermissions", {
										permissions,
										remove: !isOn,
									}),
								100,
							);
						});
					}
					(isOn ? browser.permissions.request : browser.permissions.remove)(permissions);
				}}
			/>
			<span className="feature-permission-text">
				<span>
					{type === "permission"
						? getMessage(`featurePermissions.${value}`)
						: getMessage("featurePermissions.forOrigin", {
								origin: value,
							})}
				</span>
				{hasMessage(tooltipTextKey) && (
					<Tooltip
						button={<Icon name="moreinfo" size="16x16" />}
						containerClassName="feature-permission-tooltip"
						className={classNames("feature-permission-tooltip-content", {
							"is-iframe": top !== window,
						})}
					>
						{getMessage(tooltipTextKey)}
					</Tooltip>
				)}
			</span>
			{!hasPermission && showError && (
				<span className="text-error">
					{getMessage("featurePermissions.required.error")}
				</span>
			)}
		</li>
	);
}

export type FeaturePermissionListProps = {
	permissionType: "required" | "optional";
	permissions: Permissions;
	featureId: AnyFeature["id"];
	showError?: boolean;
};

function FeaturePermissionList({
	permissionType,
	permissions,
	featureId,
	showError,
}: FeaturePermissionListProps) {
	return (
		<div className="feature-permissions-section">
			<h5>{getMessage(`featurePermissions.${permissionType}`)}</h5>
			<ul className="text feature-permissions-list">
				{permissions.permissions?.map((permission) => (
					<FeaturePermission
						type="permission"
						key={permission}
						showError={showError}
						value={permission}
						featureId={featureId}
					/>
				))}
				{permissions.origins?.map((origin) => (
					<FeaturePermission
						type="origin"
						key={origin}
						showError={showError}
						value={origin}
						featureId={featureId}
					/>
				))}
			</ul>
		</div>
	);
}

export type FeaturePermissionsProps = {
	feature: Feature;
	showError?: boolean;
};

export default function FeaturePermissions({
	feature,
	showError: _showError = false,
}: FeaturePermissionsProps) {
	const [showError, setShowError] = useState(_showError);
	if (import.meta.env.TARGET_BASE !== "firefox") {
		useEffect(() => {
			return addMessageListener("featurePermissions.showError", setShowError);
		}, []);
	}

	return (
		<div className="feature-permissions">
			{feature.permissions?.required && (
				<FeaturePermissionList
					permissionType="required"
					permissions={feature.permissions.required}
					featureId={feature.id as AnyFeature["id"]}
					showError={showError || _showError}
				/>
			)}
			{feature.permissions?.optional && (
				<FeaturePermissionList
					permissionType="optional"
					permissions={feature.permissions.optional}
					featureId={feature.id as AnyFeature["id"]}
				/>
			)}
		</div>
	);
}

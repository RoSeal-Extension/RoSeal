import { regionNamesFormat, unitListFormat } from "src/ts/helpers/i18n/intlFormats";
import type { RobloxDataCenterLocation } from "src/ts/helpers/requests/services/roseal";

export function getLocalizedRegionName(
	location: RobloxDataCenterLocation,
	isShortForm?: boolean,
	isLongForm?: boolean,
) {
	const localizedCountry =
		(!isShortForm && regionNamesFormat.of(location.country)) || location.country;
	const city = location.city;
	const subregion = location.region;

	// Create a list of unique location parts
	const locationParts: string[] = [];

	if (city && city !== localizedCountry) {
		locationParts.push(city);
	}

	if (isLongForm && subregion !== city && subregion !== localizedCountry) {
		locationParts.push(subregion);
	}

	// Always add the country
	locationParts.push(localizedCountry);

	// Format the location parts using the browser's list formatter
	return unitListFormat.format(locationParts);
}

export function getDistanceLatLong(latLong1: [number, number], latLong2: [number, number]) {
	const [lat1, lon1] = latLong1;
	const [lat2, lon2] = latLong2;
	const earthRadiusKm = 6371;

	const toRadians = (degrees: number): number => {
		return degrees * (Math.PI / 180);
	};
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = earthRadiusKm * c;

	return distance;
}

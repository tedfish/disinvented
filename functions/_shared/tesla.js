const DEFAULT_TESLA_API_BASE_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com';

function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
}

function parseTeslaTimestamp(value) {
    if (typeof value === 'number') {
        const milliseconds = value > 1e12 ? value : value * 1000;
        return new Date(milliseconds).toISOString();
    }

    if (typeof value === 'string' && value.trim()) {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return new Date(parsed).toISOString();
        }
    }

    return null;
}

function celsiusToFahrenheit(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return null;
    }
    return Math.round((value * 9) / 5 + 32);
}

function getVehicleResponse(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Tesla API returned an invalid payload.');
    }

    if (payload.response && typeof payload.response === 'object') {
        return payload.response;
    }

    return payload;
}

function getVehicleLabel(vehicleData) {
    return vehicleData.display_name || vehicleData.vehicle_state?.vehicle_name || 'Tesla Reliquary';
}

function getSnapshotTimestamp(vehicleData) {
    return parseTeslaTimestamp(vehicleData.drive_state?.timestamp)
        || parseTeslaTimestamp(vehicleData.charge_state?.timestamp)
        || parseTeslaTimestamp(vehicleData.vehicle_state?.timestamp)
        || new Date().toISOString();
}

function getBatteryLevel(vehicleData) {
    const batteryLevel = vehicleData.charge_state?.battery_level;
    if (typeof batteryLevel !== 'number' || Number.isNaN(batteryLevel)) {
        throw new Error('Tesla vehicle_data did not include charge_state.battery_level.');
    }
    return Math.round(batteryLevel);
}

function getCabinTemp(vehicleData) {
    const fahrenheit = celsiusToFahrenheit(vehicleData.climate_state?.inside_temp);
    if (fahrenheit === null) {
        throw new Error('Tesla vehicle_data did not include climate_state.inside_temp.');
    }
    return fahrenheit;
}

function getOutsideTemp(vehicleData, fallbackWeatherTemp) {
    const fahrenheit = celsiusToFahrenheit(vehicleData.climate_state?.outside_temp);
    if (fahrenheit !== null) {
        return fahrenheit;
    }
    if (typeof fallbackWeatherTemp === 'number' && !Number.isNaN(fallbackWeatherTemp)) {
        return fallbackWeatherTemp;
    }
    throw new Error('Tesla vehicle_data did not include climate_state.outside_temp.');
}

function readRequiredOverride(overrides, field, message) {
    const value = overrides[field];
    if (value === undefined || value === null || value === '') {
        throw new Error(message);
    }
    return value;
}

export async function fetchTeslaVehicleData(env, fetchImpl = fetch) {
    const accessToken = env && env.TESLA_ACCESS_TOKEN;
    const vehicleTag = env && env.TESLA_VEHICLE_TAG;
    const apiBaseUrl = trimTrailingSlash((env && env.TESLA_API_BASE_URL) || DEFAULT_TESLA_API_BASE_URL);

    if (!accessToken) {
        throw new Error('TESLA_ACCESS_TOKEN is not configured.');
    }

    if (!vehicleTag) {
        throw new Error('TESLA_VEHICLE_TAG is not configured.');
    }

    const url = `${apiBaseUrl}/api/1/vehicles/${encodeURIComponent(vehicleTag)}/vehicle_data?endpoints=charge_state%3Bclimate_state%3Bdrive_state%3Bvehicle_state%3Blocation_data`;
    const response = await fetchImpl(url, {
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Tesla API request failed with ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = await response.json();
    return getVehicleResponse(payload);
}

export function getTeslaConfigStatus(env) {
    return {
        hasAccessToken: Boolean(env && env.TESLA_ACCESS_TOKEN),
        hasVehicleTag: Boolean(env && env.TESLA_VEHICLE_TAG),
        apiBaseUrl: trimTrailingSlash((env && env.TESLA_API_BASE_URL) || DEFAULT_TESLA_API_BASE_URL)
    };
}

export function createTripSummaryFromTeslaSnapshot(vehicleData, overrides = {}) {
    const normalizedVehicleData = getVehicleResponse(vehicleData);
    const snapshotTimestamp = getSnapshotTimestamp(normalizedVehicleData);
    const label = String(overrides.label || getVehicleLabel(normalizedVehicleData)).trim();
    const startedAt = String(overrides.startedAt || snapshotTimestamp).trim();
    const batteryEndPercent = overrides.batteryEndPercent !== undefined
        ? Number(overrides.batteryEndPercent)
        : getBatteryLevel(normalizedVehicleData);
    const outsideTempOverride = overrides.outsideTempF !== undefined ? Number(overrides.outsideTempF) : undefined;

    return {
        id: overrides.id,
        label,
        startedAt,
        distanceMiles: Number(readRequiredOverride(overrides, 'distanceMiles', 'distanceMiles is required for Tesla sync.')),
        batteryStartPercent: Number(readRequiredOverride(overrides, 'batteryStartPercent', 'batteryStartPercent is required for Tesla sync.')),
        batteryEndPercent,
        cabinTempF: overrides.cabinTempF !== undefined ? Number(overrides.cabinTempF) : getCabinTemp(normalizedVehicleData),
        outsideTempF: getOutsideTemp(normalizedVehicleData, outsideTempOverride),
        quietMinute: String(readRequiredOverride(overrides, 'quietMinute', 'quietMinute is required for Tesla sync.')),
        routeTexture: String(readRequiredOverride(overrides, 'routeTexture', 'routeTexture is required for Tesla sync.')),
        weather: String(readRequiredOverride(overrides, 'weather', 'weather is required for Tesla sync.')),
        chargeStops: overrides.chargeStops !== undefined ? Number(overrides.chargeStops) : 0,
        altitudeGainFt: overrides.altitudeGainFt !== undefined ? Number(overrides.altitudeGainFt) : 0,
        silentMinutes: Number(readRequiredOverride(overrides, 'silentMinutes', 'silentMinutes is required for Tesla sync.')),
        durationMinutes: Number(readRequiredOverride(overrides, 'durationMinutes', 'durationMinutes is required for Tesla sync.'))
    };
}

export function summarizeTeslaSource(vehicleData) {
    const normalizedVehicleData = getVehicleResponse(vehicleData);
    return {
        vehicleTag: normalizedVehicleData.vin || normalizedVehicleData.id_s || null,
        displayName: getVehicleLabel(normalizedVehicleData),
        state: normalizedVehicleData.state || normalizedVehicleData.vehicle_state?.vehicle_name || null,
        snapshotAt: getSnapshotTimestamp(normalizedVehicleData),
        batteryLevel: normalizedVehicleData.charge_state?.battery_level ?? null,
        latitude: normalizedVehicleData.drive_state?.latitude ?? normalizedVehicleData.drive_state?.active_route_latitude ?? null,
        longitude: normalizedVehicleData.drive_state?.longitude ?? normalizedVehicleData.drive_state?.active_route_longitude ?? null
    };
}

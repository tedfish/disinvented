import { ingestTripSummary, isKvConfigured } from '../../_shared/reliquary.js';
import { createTripSummaryFromTeslaSnapshot, fetchTeslaVehicleData, getTeslaConfigStatus, summarizeTeslaSource } from '../../_shared/tesla.js';

function json(data, init = {}) {
    const headers = new Headers(init.headers || {});
    headers.set('content-type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify(data, null, 2), {
        ...init,
        headers
    });
}

function isLocalRequest(request) {
    const { hostname } = new URL(request.url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

function hasValidToken(request, env) {
    const configuredToken = (env && env.RELIQUARY_SYNC_TOKEN) || (env && env.RELIQUARY_INGEST_TOKEN);
    const header = request.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!configuredToken) {
        return isLocalRequest(request);
    }

    return token && token === configuredToken;
}

function getMockVehicleData(payload, request) {
    if (!isLocalRequest(request)) {
        return null;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if (payload.teslaSnapshot && typeof payload.teslaSnapshot === 'object') {
        return payload.teslaSnapshot;
    }

    return null;
}

export async function onRequestGet() {
    const env = arguments[0]?.env;
    const teslaConfig = getTeslaConfigStatus(env);
    const missingConfig = [];

    if (!teslaConfig.hasAccessToken) {
        missingConfig.push('TESLA_ACCESS_TOKEN');
    }

    if (!teslaConfig.hasVehicleTag) {
        missingConfig.push('TESLA_VEHICLE_TAG');
    }

    return json({
        endpoint: '/api/relics/sync',
        method: 'POST',
        description: 'Fetch Tesla vehicle_data server-side, merge it with trip-level overrides, and persist a new Road Reliquary relic.',
        requiredOverrides: [
            'distanceMiles',
            'batteryStartPercent',
            'quietMinute',
            'routeTexture',
            'weather',
            'silentMinutes',
            'durationMinutes'
        ],
        optionalOverrides: [
            'id',
            'label',
            'startedAt',
            'batteryEndPercent',
            'cabinTempF',
            'outsideTempF',
            'chargeStops',
            'altitudeGainFt'
        ],
        config: {
            teslaApiReady: missingConfig.length === 0,
            missing: missingConfig,
            apiBaseUrl: teslaConfig.apiBaseUrl,
            syncTokenConfigured: Boolean((env && env.RELIQUARY_SYNC_TOKEN) || (env && env.RELIQUARY_INGEST_TOKEN))
        },
        devOnly: 'Pass teslaSnapshot in the POST body on localhost to test the sync path without Tesla credentials.'
    });
}

export async function onRequestPost(context) {
    if (!hasValidToken(context.request, context.env)) {
        return json({
            error: 'Unauthorized. Provide Authorization: Bearer <RELIQUARY_SYNC_TOKEN>.'
        }, { status: 401 });
    }

    let payload;
    try {
        payload = await context.request.json();
    } catch {
        return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    try {
        const vehicleData = getMockVehicleData(payload, context.request) || await fetchTeslaVehicleData(context.env);
        const summary = createTripSummaryFromTeslaSnapshot(vehicleData, payload || {});
        const relic = await ingestTripSummary(context.env, summary);

        return json({
            relic,
            persisted: isKvConfigured(context.env),
            source: summarizeTeslaSource(vehicleData),
            mode: getMockVehicleData(payload, context.request) ? 'mock-snapshot' : 'tesla-api'
        }, { status: 201 });
    } catch (error) {
        return json({
            error: error instanceof Error ? error.message : 'Unable to sync Tesla trip.'
        }, { status: 400 });
    }
}

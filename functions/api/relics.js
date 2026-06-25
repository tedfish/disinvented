import { ingestTripSummary, isKvConfigured, listRelics } from '../_shared/reliquary.js';

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
    const configuredToken = env && env.RELIQUARY_INGEST_TOKEN;
    const header = request.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!configuredToken) {
        return isLocalRequest(request);
    }

    return token && token === configuredToken;
}

export async function onRequestGet(context) {
    const items = await listRelics(context.env);
    return json({
        items,
        count: items.length,
        storage: isKvConfigured(context.env) ? 'kv' : 'memory-seed'
    });
}

export async function onRequestPost(context) {
    if (!hasValidToken(context.request, context.env)) {
        return json({
            error: 'Unauthorized. Provide Authorization: Bearer <RELIQUARY_INGEST_TOKEN>.'
        }, { status: 401 });
    }

    let payload;
    try {
        payload = await context.request.json();
    } catch {
        return json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    try {
        const relic = await ingestTripSummary(context.env, payload);
        return json({
            relic,
            persisted: isKvConfigured(context.env)
        }, { status: 201 });
    } catch (error) {
        return json({
            error: error instanceof Error ? error.message : 'Unable to create relic.'
        }, { status: 400 });
    }
}

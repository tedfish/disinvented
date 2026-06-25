const RELICS_KEY = 'reliquary:relics';
const localState = globalThis.__reliquaryLocalState || { relics: null };
globalThis.__reliquaryLocalState = localState;

const seedTrips = [
    {
        id: 'coastal-departure-2026-06-25',
        label: 'Coastal Departure',
        startedAt: '2026-06-25T06:12:00Z',
        distanceMiles: 312,
        batteryStartPercent: 88,
        batteryEndPercent: 24,
        cabinTempF: 68,
        outsideTempF: 54,
        quietMinute: '06:47',
        routeTexture: 'coast, grade, charger',
        weather: 'Fog',
        chargeStops: 1,
        altitudeGainFt: 4200,
        silentMinutes: 143,
        durationMinutes: 364
    },
    {
        id: 'heat-mirage-run-2026-06-18',
        label: 'Heat Mirage Run',
        startedAt: '2026-06-18T14:08:00Z',
        distanceMiles: 187,
        batteryStartPercent: 79,
        batteryEndPercent: 18,
        cabinTempF: 70,
        outsideTempF: 101,
        quietMinute: '15:23',
        routeTexture: 'sun, straightaway, supercharger',
        weather: 'Sun',
        chargeStops: 2,
        altitudeGainFt: 1600,
        silentMinutes: 71,
        durationMinutes: 201
    },
    {
        id: 'midnight-return-2026-06-02',
        label: 'Midnight Return',
        startedAt: '2026-06-02T22:41:00Z',
        distanceMiles: 94,
        batteryStartPercent: 62,
        batteryEndPercent: 31,
        cabinTempF: 67,
        outsideTempF: 49,
        quietMinute: '23:14',
        routeTexture: 'rain, bridge, sleeping streets',
        weather: 'Rain',
        chargeStops: 0,
        altitudeGainFt: 700,
        silentMinutes: 54,
        durationMinutes: 118
    }
];

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'trip';
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatDate(isoDate) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(isoDate));
}

function formatTime(isoDate) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    }).format(new Date(isoDate));
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPalette(weather, outsideTempF) {
    const condition = String(weather || '').toLowerCase();

    if (condition.includes('fog')) {
        return {
            palette: 'linear-gradient(135deg, rgba(229, 233, 238, 0.95) 0%, rgba(113, 137, 154, 0.8) 45%, rgba(12, 21, 31, 1) 100%)',
            accent: '#dfe8ef'
        };
    }

    if (condition.includes('rain') || condition.includes('storm')) {
        return {
            palette: 'linear-gradient(135deg, rgba(113, 133, 171, 0.95) 0%, rgba(33, 54, 88, 0.88) 42%, rgba(5, 7, 18, 1) 100%)',
            accent: '#d5e3ff'
        };
    }

    if (outsideTempF >= 90 || condition.includes('sun') || condition.includes('clear')) {
        return {
            palette: 'linear-gradient(135deg, rgba(255, 234, 169, 0.98) 0%, rgba(255, 150, 72, 0.84) 40%, rgba(72, 25, 3, 1) 100%)',
            accent: '#ffe5a6'
        };
    }

    return {
        palette: 'linear-gradient(135deg, rgba(194, 214, 255, 0.92) 0%, rgba(86, 116, 170, 0.82) 50%, rgba(10, 18, 33, 1) 100%)',
        accent: '#d7e3ff'
    };
}

function buildTitle(summary) {
    const condition = String(summary.weather || '').toLowerCase();
    const route = String(summary.routeTexture || '').toLowerCase();

    if (condition.includes('fog')) {
        return 'The fog kept the world at the shoulder.';
    }

    if (condition.includes('rain')) {
        return 'Rain made the city feel borrowed.';
    }

    if (summary.outsideTempF >= 90 || condition.includes('sun')) {
        return 'Heat bent the horizon before the battery did.';
    }

    if (route.includes('mountain') || route.includes('grade')) {
        return 'The climb taught the battery patience.';
    }

    if (route.includes('night') || route.includes('sleeping')) {
        return 'The quiet arrived before the destination did.';
    }

    return 'The road was calmer than the dashboard.';
}

function buildSubtitle(summary) {
    const chargeStopLabel = summary.chargeStops === 1 ? 'One charge stop' : `${summary.chargeStops} charge stops`;
    return `${summary.distanceMiles} miles. ${chargeStopLabel}. The cabin held at ${summary.cabinTempF}F while the outside stayed at ${summary.outsideTempF}F.`;
}

function buildStory(summary) {
    const weather = String(summary.weather || 'clear').toLowerCase();
    const routeTexture = summary.routeTexture || 'road';
    const silenceRatio = summary.durationMinutes > 0 ? summary.silentMinutes / summary.durationMinutes : 0;
    const quietTone = silenceRatio > 0.35 ? 'almost silent' : 'still carrying a low electric hum';
    const chargeSentence = summary.chargeStops > 0
        ? `Charge came in ${summary.chargeStops === 1 ? 'one measured pause' : `${summary.chargeStops} measured pauses`}, more punctuation than interruption.`
        : 'There was no charging stop, just a continuous reduction of possibility.';

    return `You left at ${formatTime(summary.startedAt)} with ${weather} pressing against ${routeTexture}. The battery fell in deliberate steps. At ${summary.quietMinute} the machine was ${quietTone}. ${chargeSentence}`;
}

function buildFooter(summary) {
    const weather = String(summary.weather || '').toLowerCase();

    if (weather.includes('fog')) {
        return 'Saved as a dawn relic, where range anxiety became weather and distance became memory.';
    }

    if (weather.includes('rain')) {
        return 'Saved as a night relic, where the machine receded and the weather wrote most of the sentence.';
    }

    if (summary.outsideTempF >= 90 || weather.includes('sun')) {
        return 'Saved as a noon relic, where power loss felt deliberate and sunlight became its own instrument.';
    }

    return 'Saved as a trip relic instead of a dashboard event log.';
}

function normalizeTripSummary(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Trip payload must be a JSON object.');
    }

    const label = String(payload.label || '').trim();
    const startedAt = String(payload.startedAt || '').trim();
    const quietMinute = String(payload.quietMinute || '').trim();
    const routeTexture = String(payload.routeTexture || '').trim();
    const weather = String(payload.weather || '').trim();

    if (!label) {
        throw new Error('Trip label is required.');
    }

    if (!startedAt || Number.isNaN(Date.parse(startedAt))) {
        throw new Error('startedAt must be a valid ISO date string.');
    }

    if (!quietMinute) {
        throw new Error('quietMinute is required.');
    }

    if (!routeTexture) {
        throw new Error('routeTexture is required.');
    }

    if (!weather) {
        throw new Error('weather is required.');
    }

    const summary = {
        id: String(payload.id || `${slugify(label)}-${startedAt.slice(0, 10)}`),
        label,
        startedAt,
        distanceMiles: clamp(Number(payload.distanceMiles), 1, 5000),
        batteryStartPercent: clamp(Number(payload.batteryStartPercent), 0, 100),
        batteryEndPercent: clamp(Number(payload.batteryEndPercent), 0, 100),
        cabinTempF: clamp(Number(payload.cabinTempF), -40, 160),
        outsideTempF: clamp(Number(payload.outsideTempF), -80, 160),
        quietMinute,
        routeTexture,
        weather: capitalize(weather.toLowerCase()),
        chargeStops: clamp(Number(payload.chargeStops), 0, 20),
        altitudeGainFt: clamp(Number(payload.altitudeGainFt), 0, 50000),
        silentMinutes: clamp(Number(payload.silentMinutes), 0, 10000),
        durationMinutes: clamp(Number(payload.durationMinutes), 1, 10000)
    };

    if (summary.batteryEndPercent > summary.batteryStartPercent) {
        throw new Error('batteryEndPercent cannot exceed batteryStartPercent.');
    }

    const requiredNumericFields = [
        'distanceMiles',
        'batteryStartPercent',
        'batteryEndPercent',
        'cabinTempF',
        'outsideTempF',
        'chargeStops',
        'altitudeGainFt',
        'silentMinutes',
        'durationMinutes'
    ];

    requiredNumericFields.forEach((field) => {
        if (Number.isNaN(summary[field])) {
            throw new Error(`${field} must be a number.`);
        }
    });

    return summary;
}

export function createRelicFromTrip(payload, index) {
    const summary = normalizeTripSummary(payload);
    const silenceIndex = clamp(Math.round((summary.silentMinutes / summary.durationMinutes) * 100 + 42), 42, 96);
    const palette = getPalette(summary.weather, summary.outsideTempF);
    const batterySpent = clamp(summary.batteryStartPercent - summary.batteryEndPercent, 0, 100);

    return {
        id: summary.id,
        index: `Reliquary ${String(index).padStart(2, '0')}`,
        label: summary.label,
        date: formatDate(summary.startedAt),
        meta: `${summary.weather}, ${formatTime(summary.startedAt)}, ${summary.distanceMiles} mi`,
        distance: summary.distanceMiles,
        batteryStart: summary.batteryStartPercent,
        batteryEnd: summary.batteryEndPercent,
        cabinTemp: summary.cabinTempF,
        outsideTemp: summary.outsideTempF,
        quietMinute: summary.quietMinute,
        routeTexture: summary.routeTexture,
        weather: summary.weather,
        chargeStops: summary.chargeStops,
        altitudeGain: summary.altitudeGainFt,
        silentMinutes: summary.silentMinutes,
        durationMinutes: summary.durationMinutes,
        silenceIndex,
        batterySpent,
        palette: palette.palette,
        accent: palette.accent,
        title: buildTitle(summary),
        subtitle: buildSubtitle(summary),
        story: buildStory(summary),
        footer: buildFooter(summary),
        createdAt: summary.startedAt
    };
}

function buildSeedRelics() {
    return seedTrips
        .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))
        .map((trip, index) => createRelicFromTrip(trip, index + 1));
}

async function readStoredRelics(env) {
    if (env && env.RELIQUARY_KV) {
        const stored = await env.RELIQUARY_KV.get(RELICS_KEY, 'json');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    }

    if (!Array.isArray(localState.relics) || localState.relics.length === 0) {
        localState.relics = buildSeedRelics();
    }

    return localState.relics;
}

async function writeStoredRelics(env, relics) {
    if (env && env.RELIQUARY_KV) {
        await env.RELIQUARY_KV.put(RELICS_KEY, JSON.stringify(relics));
    }

    localState.relics = relics;
}

export async function listRelics(env) {
    return readStoredRelics(env);
}

export async function ingestTripSummary(env, payload) {
    const relics = await readStoredRelics(env);
    const normalized = normalizeTripSummary(payload);
    const withoutDuplicate = relics.filter((relic) => relic.id !== normalized.id);
    const nextRelics = [
        createRelicFromTrip(normalized, 1),
        ...withoutDuplicate
            .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
            .map((relic, index) => ({
                ...relic,
                index: `Reliquary ${String(index + 2).padStart(2, '0')}`
            }))
    ];

    await writeStoredRelics(env, nextRelics);
    return nextRelics[0];
}

export function isKvConfigured(env) {
    return Boolean(env && env.RELIQUARY_KV);
}

export function getSeedTrips() {
    return seedTrips.slice();
}

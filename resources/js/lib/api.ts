/**
 * API client for flood alert system
 */

const API_BASE = '/api';

async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

// Reports API
export const reportsApi = {
    getAll: (params?: { status?: string; type?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchApi<Report[]>(`/reports${query}`);
    },
    getById: (id: number) => fetchApi<Report>(`/reports/${id}`),
    create: (data: FormData) =>
        fetch(`${API_BASE}/reports`, {
            method: 'POST',
            body: data,
        }).then((r) => r.json()),
    update: (id: number, data: Partial<Report>) =>
        fetchApi<Report>(`/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: number) =>
        fetchApi<void>(`/reports/${id}`, { method: 'DELETE' }),
    getNearby: (latitude: number, longitude: number, radiusKm?: number) => {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            ...(radiusKm && { radius_km: radiusKm.toString() }),
        });
        return fetchApi<Report[]>(`/reports/nearby?${params}`);
    },
};

// AI Verification Logs API
export const aiLogsApi = {
    getAll: (params?: { action?: string; report_id?: number }) => {
        const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return fetchApi<AIVerificationLog[]>(`/ai-logs${query}`);
    },
    getById: (id: number) => fetchApi<AIVerificationLog>(`/ai-logs/${id}`),
};

// Resources API
export const resourcesApi = {
    getAll: (params?: { type?: string; status?: string; organization?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchApi<Resource[]>(`/resources${query}`);
    },
    getById: (id: number) => fetchApi<Resource>(`/resources/${id}`),
    create: (data: Omit<Resource, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) =>
        fetchApi<Resource>('/resources', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: number, data: Partial<Resource>) =>
        fetchApi<Resource>(`/resources/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: number) =>
        fetchApi<void>(`/resources/${id}`, { method: 'DELETE' }),
};

// Weather Warnings API
export const weatherWarningsApi = {
    getAll: (params?: { severity?: string; area?: string; active_only?: boolean }) => {
        const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return fetchApi<WeatherWarning[]>(`/weather-warnings${query}`);
    },
    getById: (id: number) => fetchApi<WeatherWarning>(`/weather-warnings/${id}`),
    create: (data: Omit<WeatherWarning, 'id' | 'timestamp' | 'createdAt'>) =>
        fetchApi<WeatherWarning>('/weather-warnings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: number, data: Partial<WeatherWarning>) =>
        fetchApi<WeatherWarning>(`/weather-warnings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: number) =>
        fetchApi<void>(`/weather-warnings/${id}`, { method: 'DELETE' }),
};

// Disaster Alerts API
export const disasterAlertsApi = {
    getAll: (params?: { type?: string; severity?: string; location?: string; active_only?: boolean }) => {
        const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return fetchApi<DisasterAlert[]>(`/disaster-alerts${query}`);
    },
    getById: (id: number) => fetchApi<DisasterAlert>(`/disaster-alerts/${id}`),
    create: (data: Omit<DisasterAlert, 'id' | 'issuedAt' | 'createdAt' | 'isActive' | 'isValid'>) =>
        fetchApi<DisasterAlert>('/disaster-alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (id: number, data: Partial<DisasterAlert>) =>
        fetchApi<DisasterAlert>(`/disaster-alerts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: number) =>
        fetchApi<void>(`/disaster-alerts/${id}`, { method: 'DELETE' }),
};

// Alert Subscriptions API
export const subscriptionsApi = {
    create: (data: {
        email?: string;
        telegram_id?: string;
        method: 'email' | 'telegram' | 'both';
        location?: string;
        latitude?: number;
        longitude?: number;
        radius_km?: number;
        alert_types?: string[];
    }) =>
        fetchApi<{ id: number; message: string }>('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    delete: (id: number) =>
        fetchApi<{ message: string }>(`/subscriptions/${id}`, { method: 'DELETE' }),
};

// Type definitions
export interface Report {
    id: number;
    location: string;
    coordinates: string | null;
    latitude: number | null;
    longitude: number | null;
    type: string;
    typeLabel: string;
    status: 'pending' | 'verified' | 'rejected';
    description: string | null;
    submittedBy: string | null;
    imageUrl: string | null;
    timestamp: string;
    createdAt: string;
    distance?: string;
}

export interface AIVerificationLog {
    id: number;
    reportId: number;
    action: 'verified' | 'rejected' | 'pending_review';
    confidence: number;
    details: string | null;
    model: string | null;
    analysisData: Record<string, unknown> | null;
    timestamp: string;
    createdAt: string;
}

export interface Resource {
    id: number;
    type: 'boat' | 'food' | 'clothing' | 'medical' | 'water' | 'shelter' | 'transport' | 'other';
    name: string;
    quantity: number;
    unit: string;
    location: string;
    coordinates: string | null;
    latitude: number | null;
    longitude: number | null;
    organization: string;
    contactName: string;
    contactPhone: string | null;
    contactEmail: string | null;
    status: 'available' | 'limited' | 'depleted' | 'reserved';
    notes: string | null;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
}

export interface WeatherWarning {
    id: number;
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    source: string | null;
    isActive: boolean;
    expiresAt: string | null;
    isExpired: boolean;
    timestamp: string;
    createdAt: string;
}

export interface DisasterAlert {
    id: number;
    type: 'flood' | 'storm' | 'landslide' | 'haze' | 'heatwave';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: string;
    coordinates: string | null;
    latitude: number | null;
    longitude: number | null;
    issuedAt: string;
    validUntil: string;
    instructions: string[];
    isActive: boolean;
    isValid: boolean;
    createdAt: string;
}

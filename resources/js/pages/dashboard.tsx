import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
    Search,
    MapPin,
    AlertTriangle,
    Cloud,
    Activity,
    Database,
    Zap,
    Shield,
    Radio,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    Image,
    TrendingUp,
    BarChart3,
    Users,
    FileText,
    ChevronRight,
    Filter,
    Download,
    RefreshCw,
} from 'lucide-react';

type ActiveSection = 'live-map' | 'reports' | 'ai-logs' | 'analytics';

interface Report {
    id: number;
    location: string;
    type: string;
    status: 'verified' | 'pending' | 'rejected';
    timestamp: string;
    submittedBy?: string;
    imageUrl?: string;
    coordinates?: string;
}

interface AIVerificationLog {
    id: number;
    reportId: number;
    action: 'verified' | 'rejected' | 'pending_review';
    confidence: number;
    timestamp: string;
    details: string;
    model: string;
}

interface WeatherWarning {
    id: number;
    area: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export default function Dashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [mapLoaded, setMapLoaded] = useState(false);
    const [activeSection, setActiveSection] = useState<ActiveSection>('live-map');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);

    // Mock state for reports (expanded)
    const [reports] = useState<Report[]>([
        { id: 1, location: 'George Town', type: 'Flash Flood', status: 'verified', timestamp: '2 min ago', submittedBy: 'Ahmad bin Hassan', coordinates: '5.4141° N, 100.3288° E' },
        { id: 2, location: 'Bayan Lepas', type: 'Heavy Rain', status: 'pending', timestamp: '5 min ago', submittedBy: 'Siti Nurhaliza', coordinates: '5.2945° N, 100.2610° E' },
        { id: 3, location: 'Jalan Macalister', type: 'Road Blockage', status: 'verified', timestamp: '8 min ago', submittedBy: 'Lee Wei Ming', coordinates: '5.4180° N, 100.3250° E' },
        { id: 4, location: 'Air Itam', type: 'Landslide Risk', status: 'pending', timestamp: '12 min ago', submittedBy: 'Raj Kumar', coordinates: '5.3980° N, 100.2780° E' },
        { id: 5, location: 'Gurney Drive', type: 'Water Level Rising', status: 'rejected', timestamp: '15 min ago', submittedBy: 'Anonymous', coordinates: '5.4380° N, 100.3100° E' },
        { id: 6, location: 'Tanjung Tokong', type: 'Low Visibility', status: 'verified', timestamp: '18 min ago', submittedBy: 'Chen Mei Ling', coordinates: '5.4520° N, 100.3050° E' },
        { id: 7, location: 'Jelutong', type: 'Flash Flood', status: 'pending', timestamp: '22 min ago', submittedBy: 'Muhammad Faiz', coordinates: '5.3890° N, 100.3180° E' },
        { id: 8, location: 'Pulau Tikus', type: 'Heavy Rain', status: 'verified', timestamp: '25 min ago', submittedBy: 'Tan Ah Kow', coordinates: '5.4350° N, 100.3150° E' },
    ]);

    // Mock AI verification logs
    const [aiLogs] = useState<AIVerificationLog[]>([
        { id: 1, reportId: 1, action: 'verified', confidence: 98.5, timestamp: '2 min ago', details: 'Image analysis confirmed flooding. Water level estimated at 45cm.', model: 'FloodVision-v3' },
        { id: 2, reportId: 3, action: 'verified', confidence: 94.2, timestamp: '8 min ago', details: 'Road obstruction detected. Multiple vehicles visible in image.', model: 'HazardDetect-v2' },
        { id: 3, reportId: 5, action: 'rejected', confidence: 23.1, timestamp: '15 min ago', details: 'Image quality too low. No hazard patterns detected.', model: 'FloodVision-v3' },
        { id: 4, reportId: 6, action: 'verified', confidence: 89.7, timestamp: '18 min ago', details: 'Haze/fog detected. Visibility estimated below 100m.', model: 'VisibilityAI-v1' },
        { id: 5, reportId: 2, action: 'pending_review', confidence: 67.3, timestamp: '5 min ago', details: 'Uncertain classification. Requires human review.', model: 'FloodVision-v3' },
        { id: 6, reportId: 4, action: 'pending_review', confidence: 72.8, timestamp: '12 min ago', details: 'Potential landslide indicators detected. Confidence moderate.', model: 'GeoHazard-v1' },
        { id: 7, reportId: 8, action: 'verified', confidence: 91.4, timestamp: '25 min ago', details: 'Heavy precipitation confirmed via weather station correlation.', model: 'WeatherSync-v2' },
        { id: 8, reportId: 7, action: 'pending_review', confidence: 58.9, timestamp: '22 min ago', details: 'Image partially obscured. Flood indicators inconclusive.', model: 'FloodVision-v3' },
    ]);

    // Mock state for weather warnings
    const [weatherWarnings] = useState<WeatherWarning[]>([
        { id: 1, area: 'Penang Island', severity: 'high', description: 'Flash flood warning' },
        { id: 2, area: 'Seberang Perai', severity: 'medium', description: 'Heavy thunderstorms expected' },
    ]);

    // Alert markers data
    const alertMarkers = [
        { 
            id: 1, 
            position: { lat: 5.4141, lng: 100.3288 }, // George Town
            title: 'George Town',
            description: 'Flash Flood Alert',
            severity: 'critical' as const
        },
        { 
            id: 2, 
            position: { lat: 5.2945, lng: 100.2610 }, // Bayan Lepas
            title: 'Bayan Lepas',
            description: 'Heavy Rain Warning',
            severity: 'warning' as const
        },
        { 
            id: 3, 
            position: { lat: 5.4680, lng: 100.2500 }, // Tanjung Bungah
            title: 'Tanjung Bungah',
            description: 'Normal Conditions',
            severity: 'normal' as const
        },
    ];

    // Initialize Google Maps
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
            console.warn('Google Maps API key not configured. Using placeholder map.');
            return;
        }

        // Set options before loading libraries
        setOptions({
            key: apiKey,
            v: 'weekly',
        });

        const initMap = async () => {
            try {
                const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
                const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;

                if (mapRef.current && !googleMapRef.current) {
                    // Dark mode map styles
                    const darkMapStyles: google.maps.MapTypeStyle[] = [
                        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
                        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#475569' }] },
                        { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#334155' }] },
                        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3a3a' }] },
                        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4ade80' }] },
                        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#475569' }] },
                        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#64748b' }] },
                        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#334155' }] },
                        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                    ];

                    const map = new Map(mapRef.current, {
                        center: { lat: 5.4141, lng: 100.3288 }, // Penang center
                        zoom: 12,
                        styles: darkMapStyles,
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                    });

                    googleMapRef.current = map;

                    // Add markers with custom icons
                    alertMarkers.forEach((marker) => {
                        const markerColor = 
                            marker.severity === 'critical' ? '#ef4444' : 
                            marker.severity === 'warning' ? '#f59e0b' : '#10b981';

                        const svgMarker = {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: markerColor,
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: marker.severity === 'critical' ? 12 : marker.severity === 'warning' ? 10 : 8,
                        };

                        const mapMarker = new Marker({
                            position: marker.position,
                            map: map,
                            icon: svgMarker,
                            title: marker.title,
                        });

                        // Info window
                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div style="padding: 8px; color: #1e293b;">
                                    <h3 style="font-weight: 600; margin: 0 0 4px 0; color: ${markerColor};">${marker.title}</h3>
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">${marker.description}</p>
                                </div>
                            `,
                        });

                        mapMarker.addListener('click', () => {
                            infoWindow.open(map, mapMarker);
                        });
                    });

                    setMapLoaded(true);
                }
            } catch (error: unknown) {
                console.error('Error loading Google Maps:', error);
            }
        };

        initMap();
    }, []);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-MY', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <>
            <Head title="Command Center - CuacaGuard" />
            <div className="min-h-screen bg-slate-900 text-white">
                {/* Top Navigation */}
                <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/95 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">CuacaGuard</h1>
                                <p className="text-xs text-slate-400">ASEAN Early Warning System</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl mx-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search locations, reports, alerts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Live Clock */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-4 py-2">
                                <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
                                <span className="text-xs text-slate-400">LIVE</span>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-mono font-semibold text-emerald-400">{formatTime(currentTime)}</p>
                                <p className="text-xs text-slate-400">{formatDate(currentTime)}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* Left Sidebar */}
                    <aside className="w-64 border-r border-slate-700 bg-slate-800/50 min-h-[calc(100vh-4rem)]">
                        <nav className="p-4 space-y-2">
                            <button
                                onClick={() => setActiveSection('live-map')}
                                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    activeSection === 'live-map'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                                <MapPin className="h-5 w-5" />
                                <span className="font-medium">Live Map</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('reports')}
                                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    activeSection === 'reports'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                                <AlertTriangle className="h-5 w-5" />
                                <span>Incoming Reports</span>
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                    {reports.filter(r => r.status === 'pending').length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveSection('ai-logs')}
                                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    activeSection === 'ai-logs'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                                <Eye className="h-5 w-5" />
                                <span>AI Verification Logs</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('analytics')}
                                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    activeSection === 'analytics'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                                <Activity className="h-5 w-5" />
                                <span>Analytics</span>
                            </button>
                        </nav>

                        {/* Quick Stats */}
                        <div className="p-4 border-t border-slate-700">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Active Alerts</span>
                                    <span className="font-semibold text-amber-400">{weatherWarnings.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Reports Today</span>
                                    <span className="font-semibold text-emerald-400">{reports.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Verified</span>
                                    <span className="font-semibold text-blue-400">{reports.filter(r => r.status === 'verified').length}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6 overflow-auto max-h-[calc(100vh-4rem)]">
                        {/* Live Map Section */}
                        {activeSection === 'live-map' && (
                            <>
                                {/* Section A: Google Maps / Placeholder */}
                                <div className="relative mb-6 h-[60vh] rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
                                    {/* Google Maps Container */}
                                    <div ref={mapRef} className="absolute inset-0 w-full h-full" />
                                    
                                    {/* Fallback placeholder when Google Maps is not loaded */}
                                    {!mapLoaded && (
                                        <>
                                            {/* Map Background Placeholder */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800">
                                                <div className="h-full w-full opacity-20" style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                                }} />
                                            </div>

                                            {/* Warning Pin - George Town (Red/Critical) */}
                                            <div className="absolute top-[35%] left-[45%] z-10 group cursor-pointer">
                                                <div className="relative">
                                                    <div className="absolute -inset-2 animate-ping rounded-full bg-red-500/50"></div>
                                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/50">
                                                        <MapPin className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="absolute left-12 top-0 hidden group-hover:block">
                                                    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm whitespace-nowrap">
                                                        <p className="font-semibold text-red-400">George Town</p>
                                                        <p className="text-xs text-slate-400">Flash Flood Alert</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Warning Pin - Bayan Lepas (Amber/Warning) */}
                                            <div className="absolute top-[65%] left-[35%] z-10 group cursor-pointer">
                                                <div className="relative">
                                                    <div className="absolute -inset-2 animate-pulse rounded-full bg-amber-500/30"></div>
                                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/50">
                                                        <MapPin className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="absolute left-12 top-0 hidden group-hover:block">
                                                    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm whitespace-nowrap">
                                                        <p className="font-semibold text-amber-400">Bayan Lepas</p>
                                                        <p className="text-xs text-slate-400">Heavy Rain Warning</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emerald Pin - Safe Zone */}
                                            <div className="absolute top-[50%] left-[60%] z-10 group cursor-pointer">
                                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                                                    <MapPin className="h-4 w-4 text-white" />
                                                </div>
                                                <div className="absolute left-10 top-0 hidden group-hover:block">
                                                    <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm whitespace-nowrap">
                                                        <p className="font-semibold text-emerald-400">Tanjung Bungah</p>
                                                        <p className="text-xs text-slate-400">Normal Conditions</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* API Key Notice */}
                                            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-3">
                                                <p className="text-sm text-amber-300">
                                                    <span className="font-semibold">Note:</span> Add your Google Maps API key to <code className="bg-slate-800 px-1.5 py-0.5 rounded">.env</code> file as <code className="bg-slate-800 px-1.5 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to enable the interactive map.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Map Header - Always visible */}
                                    <div className="absolute top-4 left-4 z-10 rounded-lg bg-slate-900/80 backdrop-blur px-4 py-2">
                                        <h2 className="text-sm font-semibold text-white">Penang Island - Live Monitoring</h2>
                                        <p className="text-xs text-slate-400">Real-time hazard visualization</p>
                                    </div>

                                    {/* Legend - Always visible */}
                                    <div className="absolute top-4 right-4 z-10 rounded-lg bg-slate-900/80 backdrop-blur px-4 py-3">
                                        <p className="text-xs font-semibold text-slate-400 mb-2">Alert Levels</p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                                                <span className="text-slate-300">Critical</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                                                <span className="text-slate-300">Warning</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                                                <span className="text-slate-300">Normal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section B: Data Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Card 1: Official MET Data */}
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                                    <Cloud className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <h3 className="font-semibold text-white">Official MET Data</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="rounded-lg bg-slate-700/50 p-3">
                                                <p className="text-xs text-slate-400 mb-1">Current Status</p>
                                                <p className="text-sm font-medium text-white">Hujan di beberapa tempat</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-400">Risk Score</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 rounded-full bg-slate-700 overflow-hidden">
                                                        <div className="h-full w-[40%] rounded-full bg-amber-500"></div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-amber-400">40/100</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400">
                                                    Medium Risk
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: AI Crowd-Truth Alerts (High Priority - Glowing) */}
                                    <div className="relative rounded-lg border border-red-500/50 bg-slate-800 p-5 shadow-lg shadow-red-500/20">
                                        {/* Glow effect */}
                                        <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-red-500 to-amber-500 opacity-20 blur"></div>
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                                                        <Zap className="h-5 w-5 text-red-400" />
                                                    </div>
                                                    <h3 className="font-semibold text-white">AI Crowd-Truth Alerts</h3>
                                                </div>
                                                <span className="flex h-3 w-3">
                                                    <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                                                    <p className="text-xs text-red-300 mb-1">⚠️ Active Alert</p>
                                                    <p className="text-sm font-medium text-white">Flash Flood Detected - Jalan Macalister</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-400">Risk Score</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-24 rounded-full bg-slate-700 overflow-hidden">
                                                            <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-red-500 to-red-400"></div>
                                                        </div>
                                                        <span className="text-sm font-bold text-red-400">95/100</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                        <Eye className="h-3 w-3" />
                                                        Verified by Vision AI
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: System Health */}
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                                                    <Activity className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <h3 className="font-semibold text-white">System Health</h3>
                                            </div>
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                                All Systems Go
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-emerald-400" />
                                                    <span className="text-sm text-slate-300">n8n API Polling</span>
                                                </div>
                                                <span className="text-sm font-medium text-emerald-400">Active</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-emerald-400" />
                                                    <span className="text-sm text-slate-300">MySQL Connection</span>
                                                </div>
                                                <span className="text-sm font-medium text-emerald-400">99.9% Uptime</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2">
                                                Last checked: {formatTime(currentTime)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Incoming Reports Section */}
                        {activeSection === 'reports' && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Incoming Reports</h2>
                                        <p className="text-sm text-slate-400">Citizen-submitted hazard reports requiring review</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                                            <Filter className="h-4 w-4" />
                                            Filter
                                        </button>
                                        <button className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                                            <Download className="h-4 w-4" />
                                            Export
                                        </button>
                                        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{reports.length}</p>
                                                <p className="text-xs text-slate-400">Total Reports</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-amber-500/30 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                                <Clock className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-amber-400">{reports.filter(r => r.status === 'pending').length}</p>
                                                <p className="text-xs text-slate-400">Pending Review</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-emerald-500/30 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-emerald-400">{reports.filter(r => r.status === 'verified').length}</p>
                                                <p className="text-xs text-slate-400">Verified</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-red-500/30 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                                                <XCircle className="h-5 w-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-red-400">{reports.filter(r => r.status === 'rejected').length}</p>
                                                <p className="text-xs text-slate-400">Rejected</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reports List */}
                                <div className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
                                    <div className="border-b border-slate-700 bg-slate-800/50 px-6 py-4">
                                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            <div className="col-span-1">ID</div>
                                            <div className="col-span-2">Location</div>
                                            <div className="col-span-2">Type</div>
                                            <div className="col-span-2">Submitted By</div>
                                            <div className="col-span-2">Time</div>
                                            <div className="col-span-2">Status</div>
                                            <div className="col-span-1">Action</div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-700">
                                        {reports.map((report) => (
                                            <div
                                                key={report.id}
                                                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-700/30 transition-colors cursor-pointer items-center"
                                                onClick={() => setSelectedReport(report)}
                                            >
                                                <div className="col-span-1 text-sm text-slate-400">#{report.id}</div>
                                                <div className="col-span-2">
                                                    <p className="text-sm font-medium text-white">{report.location}</p>
                                                    <p className="text-xs text-slate-500">{report.coordinates}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {report.type}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-sm text-slate-300">{report.submittedBy}</div>
                                                <div className="col-span-2 text-sm text-slate-400">{report.timestamp}</div>
                                                <div className="col-span-2">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        report.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        report.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {report.status === 'verified' && <CheckCircle className="h-3 w-3" />}
                                                        {report.status === 'pending' && <Clock className="h-3 w-3" />}
                                                        {report.status === 'rejected' && <XCircle className="h-3 w-3" />}
                                                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="col-span-1">
                                                    <button className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-600 transition-colors">
                                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Report Detail Modal */}
                                {selectedReport && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                                        <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Report #{selectedReport.id}</h3>
                                                    <p className="text-sm text-slate-400">{selectedReport.location}</p>
                                                </div>
                                                <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white">
                                                    <XCircle className="h-6 w-6" />
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-6 mb-6">
                                                {/* Image Placeholder */}
                                                <div className="aspect-video rounded-lg border border-slate-600 bg-slate-700 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Image className="h-12 w-12 text-slate-500 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">Hazard Photo</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Details */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Hazard Type</p>
                                                        <p className="text-sm font-medium text-white">{selectedReport.type}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">GPS Coordinates</p>
                                                        <p className="text-sm font-medium text-white">{selectedReport.coordinates}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Submitted By</p>
                                                        <p className="text-sm font-medium text-white">{selectedReport.submittedBy}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Time</p>
                                                        <p className="text-sm font-medium text-white">{selectedReport.timestamp}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                                                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Verify Report
                                                </button>
                                                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                                                    <XCircle className="h-4 w-4" />
                                                    Reject Report
                                                </button>
                                                <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                                                    <MapPin className="h-4 w-4" />
                                                    View on Map
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AI Verification Logs Section */}
                        {activeSection === 'ai-logs' && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">AI Verification Logs</h2>
                                        <p className="text-sm text-slate-400">Machine learning model predictions and verification results</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                                            <Filter className="h-4 w-4" />
                                            Filter by Model
                                        </button>
                                        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {/* Model Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-400">FloodVision-v3</span>
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-1">94.2%</p>
                                        <p className="text-xs text-slate-500">Average Confidence</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-400">HazardDetect-v2</span>
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-1">91.8%</p>
                                        <p className="text-xs text-slate-500">Average Confidence</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-400">VisibilityAI-v1</span>
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white mb-1">89.7%</p>
                                        <p className="text-xs text-slate-500">Average Confidence</p>
                                    </div>
                                </div>

                                {/* Logs List */}
                                <div className="space-y-3">
                                    {aiLogs.map((log) => (
                                        <div key={log.id} className={`rounded-lg border p-4 ${
                                            log.action === 'verified' ? 'border-emerald-500/30 bg-emerald-500/5' :
                                            log.action === 'rejected' ? 'border-red-500/30 bg-red-500/5' :
                                            'border-amber-500/30 bg-amber-500/5'
                                        }`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                                        log.action === 'verified' ? 'bg-emerald-500/20' :
                                                        log.action === 'rejected' ? 'bg-red-500/20' :
                                                        'bg-amber-500/20'
                                                    }`}>
                                                        {log.action === 'verified' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                                                        {log.action === 'rejected' && <XCircle className="h-5 w-5 text-red-400" />}
                                                        {log.action === 'pending_review' && <Clock className="h-5 w-5 text-amber-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Report #{log.reportId}</p>
                                                        <p className="text-xs text-slate-400">{log.model} • {log.timestamp}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-slate-400">Confidence:</span>
                                                        <span className={`text-sm font-bold ${
                                                            log.confidence >= 80 ? 'text-emerald-400' :
                                                            log.confidence >= 50 ? 'text-amber-400' :
                                                            'text-red-400'
                                                        }`}>{log.confidence}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-24 rounded-full bg-slate-700 overflow-hidden">
                                                        <div className={`h-full rounded-full ${
                                                            log.confidence >= 80 ? 'bg-emerald-500' :
                                                            log.confidence >= 50 ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                        }`} style={{ width: `${log.confidence}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">
                                                {log.details}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analytics Section */}
                        {activeSection === 'analytics' && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                                        <p className="text-sm text-slate-400">System performance and hazard trend analysis</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300">
                                            <option>Last 24 Hours</option>
                                            <option>Last 7 Days</option>
                                            <option>Last 30 Days</option>
                                        </select>
                                        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                                            <Download className="h-4 w-4" />
                                            Export Report
                                        </button>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                                <TrendingUp className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <span className="text-sm text-slate-400">Response Time</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">2.4 min</p>
                                        <p className="text-xs text-emerald-400">↓ 15% from last week</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <span className="text-sm text-slate-400">Accuracy Rate</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">96.8%</p>
                                        <p className="text-xs text-emerald-400">↑ 2.3% from last week</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                                <Users className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <span className="text-sm text-slate-400">Active Reporters</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">1,247</p>
                                        <p className="text-xs text-emerald-400">↑ 89 new this week</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <span className="text-sm text-slate-400">Alerts Issued</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">34</p>
                                        <p className="text-xs text-red-400">↑ 12 from last week</p>
                                    </div>
                                </div>

                                {/* Charts Placeholder */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-white">Reports by Hazard Type</h3>
                                            <BarChart3 className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-28 text-sm text-slate-400">Flash Flood</span>
                                                <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden">
                                                    <div className="h-full w-[65%] rounded-full bg-red-500"></div>
                                                </div>
                                                <span className="text-sm font-medium text-white">65%</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-28 text-sm text-slate-400">Heavy Rain</span>
                                                <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden">
                                                    <div className="h-full w-[45%] rounded-full bg-blue-500"></div>
                                                </div>
                                                <span className="text-sm font-medium text-white">45%</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-28 text-sm text-slate-400">Low Visibility</span>
                                                <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden">
                                                    <div className="h-full w-[25%] rounded-full bg-amber-500"></div>
                                                </div>
                                                <span className="text-sm font-medium text-white">25%</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-28 text-sm text-slate-400">Road Blockage</span>
                                                <div className="flex-1 h-4 rounded-full bg-slate-700 overflow-hidden">
                                                    <div className="h-full w-[20%] rounded-full bg-emerald-500"></div>
                                                </div>
                                                <span className="text-sm font-medium text-white">20%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-white">Reports Over Time</h3>
                                            <TrendingUp className="h-5 w-5 text-slate-400" />
                                        </div>
                                        {/* Simple bar chart visualization */}
                                        <div className="flex items-end justify-between h-40 gap-2">
                                            {[35, 52, 28, 65, 43, 78, 55, 42, 68, 45, 82, 58].map((height, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div 
                                                        className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                                                        style={{ height: `${height}%` }}
                                                    ></div>
                                                    <span className="text-[10px] text-slate-500">{i + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 text-center mt-2">Last 12 hours</p>
                                    </div>
                                </div>

                                {/* Top Locations */}
                                <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                                    <h3 className="font-semibold text-white mb-4">Top Reporting Locations</h3>
                                    <div className="grid grid-cols-5 gap-4">
                                        {['George Town', 'Bayan Lepas', 'Air Itam', 'Jelutong', 'Tanjung Tokong'].map((location, i) => (
                                            <div key={location} className="text-center p-4 rounded-lg bg-slate-700/50">
                                                <p className="text-2xl font-bold text-white mb-1">#{i + 1}</p>
                                                <p className="text-sm text-slate-300">{location}</p>
                                                <p className="text-xs text-slate-500">{Math.floor(Math.random() * 50) + 10} reports</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Head } from '@inertiajs/react';
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
    Package,
    Plus,
    Truck,
    Heart,
    Phone,
    Mail,
    Building2,
    Utensils,
    Shirt,
    Pill,
    Anchor,
    Droplets,
    Home,
    Edit,
    Trash2,
    X,
    Locate,
    Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    reportsApi,
    aiLogsApi,
    resourcesApi,
    weatherWarningsApi,
    type Report as ApiReport,
    type AIVerificationLog as ApiAIVerificationLog,
    type Resource as ApiResource,
    type WeatherWarning as ApiWeatherWarning,
} from '@/lib/api';

type ActiveSection = 'live-map' | 'reports' | 'ai-logs' | 'analytics' | 'resources';

type ResourceType = 'boat' | 'food' | 'clothing' | 'medical' | 'water' | 'shelter' | 'transport' | 'other';

interface Resource {
    id: number;
    type: ResourceType;
    name: string;
    quantity: number;
    unit: string;
    location: string;
    coordinates: string;
    organization: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    status: 'available' | 'limited' | 'depleted' | 'reserved';
    notes: string;
    timestamp: string;
}

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
    const [isLoading, setIsLoading] = useState(true);
    const [showResourcesOnMap, setShowResourcesOnMap] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const resourceMarkersRef = useRef<google.maps.Marker[]>([]);

    // State for data from API
    const [reports, setReports] = useState<Report[]>([]);
    const [aiLogs, setAiLogs] = useState<AIVerificationLog[]>([]);
    const [weatherWarnings, setWeatherWarnings] = useState<WeatherWarning[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);

    // Filtered data based on search query
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports;
        const query = searchQuery.toLowerCase();
        return reports.filter(report =>
            report.location.toLowerCase().includes(query) ||
            report.type.toLowerCase().includes(query) ||
            (report.submittedBy?.toLowerCase().includes(query) ?? false) ||
            report.status.toLowerCase().includes(query)
        );
    }, [reports, searchQuery]);

    const filteredAiLogs = useMemo(() => {
        if (!searchQuery.trim()) return aiLogs;
        const query = searchQuery.toLowerCase();
        return aiLogs.filter(log =>
            log.details.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query) ||
            log.model.toLowerCase().includes(query)
        );
    }, [aiLogs, searchQuery]);

    const filteredResources = useMemo(() => {
        if (!searchQuery.trim()) return resources;
        const query = searchQuery.toLowerCase();
        return resources.filter(resource =>
            resource.name.toLowerCase().includes(query) ||
            resource.location.toLowerCase().includes(query) ||
            resource.organization.toLowerCase().includes(query) ||
            resource.type.toLowerCase().includes(query)
        );
    }, [resources, searchQuery]);

    // Geolocation state
    const [isLocating, setIsLocating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Navigate map to user's current location
    const navigateToMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                if (googleMapRef.current) {
                    googleMapRef.current.panTo({ lat: latitude, lng: longitude });
                    googleMapRef.current.setZoom(15);
                    setActiveSection('live-map');
                }
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to get your location. Please check your browser permissions.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    // Navigate map to searched location using Google Geocoding
    const navigateMapToSearch = useCallback(async () => {
        if (!searchQuery.trim() || !googleMapRef.current) return;
        
        setIsSearching(true);
        
        try {
            // Use Google Geocoding API to search for any location
            const { Geocoder } = await importLibrary('geocoding') as google.maps.GeocodingLibrary;
            const geocoder = new Geocoder();
            
            const response = await geocoder.geocode({ address: searchQuery });
            
            if (response.results && response.results.length > 0) {
                const location = response.results[0].geometry.location;
                googleMapRef.current.panTo(location);
                googleMapRef.current.setZoom(15);
                setActiveSection('live-map');
            } else {
                alert(`Location "${searchQuery}" not found. Try a different search term.`);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('Unable to search for location. Please try again.');
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Resource form state
    const [showResourceForm, setShowResourceForm] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [selectedPickerPoint, setSelectedPickerPoint] = useState<{ lat: number; lng: number } | null>(null);
    const locationPickerMapRef = useRef<HTMLDivElement>(null);
    const locationPickerGoogleMapRef = useRef<google.maps.Map | null>(null);
    const locationPickerMarkerRef = useRef<google.maps.Marker | null>(null);
    const [resourceForm, setResourceForm] = useState<Omit<Resource, 'id' | 'timestamp'>>({
        type: 'food',
        name: '',
        quantity: 0,
        unit: '',
        location: '',
        coordinates: '',
        organization: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        status: 'available',
        notes: '',
    });

    const formatCoordinateText = useCallback((latitude: number, longitude: number): string => {
        const latDirection = latitude >= 0 ? 'N' : 'S';
        const lngDirection = longitude >= 0 ? 'E' : 'W';
        return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(longitude).toFixed(4)}° ${lngDirection}`;
    }, []);

    const parseCoordinateText = useCallback((coordinates: string): { latitude: number; longitude: number } | null => {
        const text = coordinates.trim();
        if (!text) return null;

        const match = text.match(/^([+-]?\d+(?:\.\d+)?)°?\s*([NS])?\s*,\s*([+-]?\d+(?:\.\d+)?)°?\s*([EW])?$/i);
        if (!match) return null;

        let latitude = parseFloat(match[1]);
        const latDirection = match[2]?.toUpperCase();
        let longitude = parseFloat(match[3]);
        const lngDirection = match[4]?.toUpperCase();

        if (latDirection === 'N') latitude = Math.abs(latitude);
        if (latDirection === 'S') latitude = -Math.abs(latitude);
        if (lngDirection === 'E') longitude = Math.abs(longitude);
        if (lngDirection === 'W') longitude = -Math.abs(longitude);

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return null;
        }

        return { latitude, longitude };
    }, []);

    const placeLocationMarker = useCallback(async (latitude: number, longitude: number) => {
        if (!locationPickerGoogleMapRef.current) return;

        const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;

        if (locationPickerMarkerRef.current) {
            locationPickerMarkerRef.current.setMap(null);
        }

        locationPickerMarkerRef.current = new Marker({
            position: { lat: latitude, lng: longitude },
            map: locationPickerGoogleMapRef.current,
            title: 'Selected location',
        });

        setSelectedPickerPoint({ lat: latitude, lng: longitude });
        setResourceForm(prev => ({
            ...prev,
            coordinates: formatCoordinateText(latitude, longitude),
        }));
    }, [formatCoordinateText]);

    const reverseGeocodeLocation = useCallback(async (latitude: number, longitude: number) => {
        try {
            const { Geocoder } = await importLibrary('geocoding') as google.maps.GeocodingLibrary;
            const geocoder = new Geocoder();
            const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            const address = response.results?.[0]?.formatted_address;

            if (address) {
                setLocationSearchQuery(address);
                setResourceForm(prev => ({
                    ...prev,
                    location: address,
                }));
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    }, []);

    const searchLocationOnMap = useCallback(async () => {
        if (!locationSearchQuery.trim() || !locationPickerGoogleMapRef.current) return;

        setIsSearchingLocation(true);
        try {
            const { Geocoder } = await importLibrary('geocoding') as google.maps.GeocodingLibrary;
            const geocoder = new Geocoder();
            const response = await geocoder.geocode({ address: locationSearchQuery });
            const firstResult = response.results?.[0];

            if (!firstResult) {
                alert('Address not found. Try a different keyword.');
                return;
            }

            const latitude = firstResult.geometry.location.lat();
            const longitude = firstResult.geometry.location.lng();

            locationPickerGoogleMapRef.current.panTo({ lat: latitude, lng: longitude });
            locationPickerGoogleMapRef.current.setZoom(16);

            await placeLocationMarker(latitude, longitude);

            setResourceForm(prev => ({
                ...prev,
                location: firstResult.formatted_address,
            }));
        } catch (error) {
            console.error('Address search error:', error);
            alert('Unable to search address right now.');
        } finally {
            setIsSearchingLocation(false);
        }
    }, [locationSearchQuery, placeLocationMarker]);

    const initializeLocationPickerMap = useCallback(async () => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
            alert('Google Maps API key is not configured.');
            return;
        }

        if (!locationPickerMapRef.current) return;

        setOptions({ key: apiKey, v: 'weekly' });
        const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;

        const parsedCoordinates = parseCoordinateText(resourceForm.coordinates);
        const initialCenter = parsedCoordinates
            ? { lat: parsedCoordinates.latitude, lng: parsedCoordinates.longitude }
            : { lat: 5.4141, lng: 100.3288 };

        const map = new Map(locationPickerMapRef.current, {
            center: initialCenter,
            zoom: parsedCoordinates ? 16 : 12,
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: false,
            streetViewControl: false,
        });

        locationPickerGoogleMapRef.current = map;

        if (parsedCoordinates) {
            await placeLocationMarker(parsedCoordinates.latitude, parsedCoordinates.longitude);
        } else {
            setSelectedPickerPoint(null);
        }

        map.addListener('click', async (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;

            const latitude = event.latLng.lat();
            const longitude = event.latLng.lng();
            await placeLocationMarker(latitude, longitude);
            await reverseGeocodeLocation(latitude, longitude);
        });
    }, [parseCoordinateText, resourceForm.coordinates, placeLocationMarker, reverseGeocodeLocation]);

    useEffect(() => {
        if (!showLocationPicker) return;

        const timeoutId = window.setTimeout(() => {
            void initializeLocationPickerMap();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [showLocationPicker, initializeLocationPickerMap]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [reportsData, aiLogsData, weatherData, resourcesData] = await Promise.all([
                    reportsApi.getAll(),
                    aiLogsApi.getAll(),
                    weatherWarningsApi.getAll(),
                    resourcesApi.getAll(),
                ]);

                setReports(reportsData.map((r: ApiReport) => ({
                    id: r.id,
                    location: r.location,
                    type: r.typeLabel,
                    status: r.status,
                    timestamp: r.timestamp,
                    submittedBy: r.submittedBy || undefined,
                    imageUrl: r.imageUrl || undefined,
                    coordinates: r.coordinates || undefined,
                })));

                setAiLogs(aiLogsData.map((l: ApiAIVerificationLog) => ({
                    id: l.id,
                    reportId: l.reportId,
                    action: l.action,
                    confidence: l.confidence,
                    timestamp: l.timestamp,
                    details: l.details || '',
                    model: l.model || '',
                })));

                setWeatherWarnings(weatherData.map((w: ApiWeatherWarning) => ({
                    id: w.id,
                    area: w.area,
                    severity: w.severity,
                    description: w.description,
                })));

                setResources(resourcesData.map((r: ApiResource) => ({
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    quantity: r.quantity,
                    unit: r.unit,
                    location: r.location,
                    coordinates: r.coordinates || '',
                    organization: r.organization,
                    contactName: r.contactName,
                    contactPhone: r.contactPhone || '',
                    contactEmail: r.contactEmail || '',
                    status: r.status,
                    notes: r.notes || '',
                    timestamp: r.timestamp,
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

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

                if (mapRef.current && !googleMapRef.current) {
                    // Dark mode map styles - hide POI icons (restaurants, shops, etc.)
                    const darkMapStyles: google.maps.MapTypeStyle[] = [
                        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
                        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#475569' }] },
                        { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                        // Hide all POI icons and labels
                        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
                        { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
                        // Keep parks visible but simplified
                        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e3a3a' }, { visibility: 'simplified' }] },
                        { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#475569' }] },
                        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#64748b' }] },
                        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                    ];

                    const map = new Map(mapRef.current, {
                        center: { lat: 5.4141, lng: 100.3288 }, // Penang center
                        zoom: 12,
                        styles: darkMapStyles,
                        disableDefaultUI: true,
                        zoomControl: true,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.RIGHT_CENTER,
                        },
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                    });

                    googleMapRef.current = map;
                    setMapLoaded(true);
                }
            } catch (error: unknown) {
                console.error('Error loading Google Maps:', error);
            }
        };

        initMap();
    }, []);

    // Effect to manage resource markers on map
    useEffect(() => {
        const updateResourceMarkers = async () => {
            if (!googleMapRef.current) return;

            // Clear existing resource markers
            resourceMarkersRef.current.forEach(marker => marker.setMap(null));
            resourceMarkersRef.current = [];

            if (!showResourcesOnMap) return;

            try {
                const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;

                const resourceTypeColors: Record<ResourceType, string> = {
                    boat: '#3b82f6',      // blue
                    food: '#f97316',      // orange
                    clothing: '#ec4899',  // pink
                    medical: '#ef4444',   // red
                    water: '#06b6d4',     // cyan
                    shelter: '#f59e0b',   // amber
                    transport: '#22c55e', // green
                    other: '#64748b',     // slate
                };

                resources.forEach((resource) => {
                    if (!resource.coordinates) return;

                    // Parse coordinates like "5.4141° N, 100.3288° E"
                    const coordMatch = resource.coordinates.match(/([\d.]+)°\s*[NS],\s*([\d.]+)°\s*[EW]/);
                    if (!coordMatch) return;

                    const lat = parseFloat(coordMatch[1]);
                    const lng = parseFloat(coordMatch[2]);
                    const color = resourceTypeColors[resource.type] || '#64748b';

                    const svgMarker = {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 1.5,
                        anchor: new google.maps.Point(12, 24),
                    };

                    const marker = new Marker({
                        position: { lat, lng },
                        map: googleMapRef.current!,
                        icon: svgMarker,
                        title: resource.name,
                    });

                    const statusColors = {
                        available: '#22c55e',
                        limited: '#f59e0b',
                        depleted: '#ef4444',
                        reserved: '#3b82f6',
                    };

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="padding: 8px; color: #1e293b; min-width: 180px;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color};"></div>
                                    <h3 style="font-weight: 600; margin: 0; font-size: 14px;">${resource.name}</h3>
                                </div>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • ${resource.quantity} ${resource.unit}</p>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">${resource.location}</p>
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">${resource.organization}</p>
                                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500; background: ${statusColors[resource.status]}20; color: ${statusColors[resource.status]};">
                                    ${resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                                </span>
                            </div>
                        `,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(googleMapRef.current!, marker);
                    });

                    resourceMarkersRef.current.push(marker);
                });
            } catch (error) {
                console.error('Error adding resource markers:', error);
            }
        };

        updateResourceMarkers();
    }, [showResourcesOnMap, resources, mapLoaded]);

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
                                {isSearching ? (
                                    <Loader2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400 animate-spin pointer-events-none" />
                                ) : (
                                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                )}
                                <input
                                    type="text"
                                    placeholder="Search any location (e.g. Kuala Lumpur, Penang...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isSearching) {
                                            navigateMapToSearch();
                                        }
                                    }}
                                    disabled={isSearching}
                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-2.5 pl-10 pr-24 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {searchQuery && !isSearching && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="p-1 text-slate-400 hover:text-white transition-colors"
                                            title="Clear search"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigateMapToSearch()}
                                        disabled={isSearching || !searchQuery.trim()}
                                        className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                        title="Search location on map"
                                    >
                                        <Search className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={navigateToMyLocation}
                                        disabled={isLocating}
                                        className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        title="Navigate to my location"
                                    >
                                        {isLocating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Locate className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
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
                            <button
                                onClick={() => setActiveSection('resources')}
                                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    activeSection === 'resources'
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                        : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                                <Package className="h-5 w-5" />
                                <span>Resources & Aid</span>
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                                    {resources.filter(r => r.status === 'available').length}
                                </span>
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
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Resources</span>
                                    <span className="font-semibold text-purple-400">{resources.filter(r => r.status === 'available').length}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6 overflow-auto max-h-[calc(100vh-4rem)]">
                        {isLoading && (
                            <div className="mb-6 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-300">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                <span className="text-sm">Loading latest reports, resources, and alerts...</span>
                            </div>
                        )}

                        {/* Live Map Section */}
                        {activeSection === 'live-map' && (
                            <>
                                {/* Section A: Google Maps / Placeholder */}
                                <div className="relative mb-6 h-[60vh] rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
                                    {/* Google Maps Container */}
                                    <div ref={mapRef} className="absolute inset-0 w-full h-full" />
                                    
                                    {/* Map Controls - Toggle Resources */}
                                    {mapLoaded && (
                                        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                                            <button
                                                onClick={() => setShowResourcesOnMap(!showResourcesOnMap)}
                                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-lg transition-all ${
                                                    showResourcesOnMap
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/90'
                                                }`}
                                                title={showResourcesOnMap ? 'Hide Resources & Aid' : 'Show Resources & Aid'}
                                            >
                                                <Package className="h-4 w-4" />
                                                <span>{showResourcesOnMap ? 'Hide' : 'Show'} Resources</span>
                                            </button>
                                        </div>
                                    )}
                                    
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
                                        {filteredReports.map((report) => (
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
                                        {filteredReports.length === 0 && (
                                            <div className="px-6 py-12 text-center">
                                                <Search className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                                                <p className="text-slate-400">No reports found matching "{searchQuery}"</p>
                                            </div>
                                        )}
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
                                    {filteredAiLogs.map((log) => (
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
                                    {filteredAiLogs.length === 0 && (
                                        <div className="px-6 py-12 text-center rounded-lg border border-slate-700 bg-slate-800/50">
                                            <Search className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                                            <p className="text-slate-400">No AI logs found matching "{searchQuery}"</p>
                                        </div>
                                    )}
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

                        {/* Resources & Aid Section */}
                        {activeSection === 'resources' && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Resources & Aid</h2>
                                        <p className="text-slate-400">Volunteer and NGO material contributions</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingResource(null);
                                            setResourceForm({
                                                type: 'food',
                                                name: '',
                                                quantity: 0,
                                                unit: '',
                                                location: '',
                                                coordinates: '',
                                                organization: '',
                                                contactName: '',
                                                contactPhone: '',
                                                contactEmail: '',
                                                status: 'available',
                                                notes: '',
                                            });
                                            setShowResourceForm(true);
                                        }}
                                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Resource
                                    </button>
                                </div>

                                {/* Resource Stats */}
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-emerald-600/20 p-3">
                                                <Package className="h-6 w-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{resources.length}</p>
                                                <p className="text-xs text-slate-400">Total Resources</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-green-600/20 p-3">
                                                <CheckCircle className="h-6 w-6 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{resources.filter(r => r.status === 'available').length}</p>
                                                <p className="text-xs text-slate-400">Available</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-amber-600/20 p-3">
                                                <AlertTriangle className="h-6 w-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{resources.filter(r => r.status === 'limited').length}</p>
                                                <p className="text-xs text-slate-400">Limited</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-600/20 p-3">
                                                <Building2 className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{new Set(resources.map(r => r.organization)).size}</p>
                                                <p className="text-xs text-slate-400">Organizations</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-purple-600/20 p-3">
                                                <Heart className="h-6 w-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{resources.filter(r => r.status === 'reserved').length}</p>
                                                <p className="text-xs text-slate-400">Reserved</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Type Filter Pills */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-slate-400 py-2">Filter by type:</span>
                                    {[
                                        { type: 'all', icon: Package, label: 'All' },
                                        { type: 'boat', icon: Anchor, label: 'Boats' },
                                        { type: 'food', icon: Utensils, label: 'Food' },
                                        { type: 'clothing', icon: Shirt, label: 'Clothing' },
                                        { type: 'medical', icon: Pill, label: 'Medical' },
                                        { type: 'water', icon: Droplets, label: 'Water' },
                                        { type: 'shelter', icon: Home, label: 'Shelter' },
                                        { type: 'transport', icon: Truck, label: 'Transport' },
                                    ].map(({ type, icon: Icon, label }) => (
                                        <button
                                            key={type}
                                            className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600/50 hover:border-emerald-500/50 transition-colors"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Resources Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {filteredResources.map((resource) => {
                                        const typeConfig: Record<ResourceType, { icon: typeof Package; color: string; bg: string }> = {
                                            boat: { icon: Anchor, color: 'text-blue-400', bg: 'bg-blue-600/20' },
                                            food: { icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-600/20' },
                                            clothing: { icon: Shirt, color: 'text-pink-400', bg: 'bg-pink-600/20' },
                                            medical: { icon: Pill, color: 'text-red-400', bg: 'bg-red-600/20' },
                                            water: { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-600/20' },
                                            shelter: { icon: Home, color: 'text-amber-400', bg: 'bg-amber-600/20' },
                                            transport: { icon: Truck, color: 'text-green-400', bg: 'bg-green-600/20' },
                                            other: { icon: Package, color: 'text-slate-400', bg: 'bg-slate-600/20' },
                                        };
                                        const config = typeConfig[resource.type];
                                        const TypeIcon = config.icon;

                                        const statusConfig = {
                                            available: { label: 'Available', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                                            limited: { label: 'Limited', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                                            depleted: { label: 'Depleted', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                                            reserved: { label: 'Reserved', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                                        };

                                        return (
                                            <div key={resource.id} className="rounded-lg border border-slate-700 bg-slate-800 p-5 hover:border-slate-600 transition-colors">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-lg p-3 ${config.bg}`}>
                                                            <TypeIcon className={`h-6 w-6 ${config.color}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{resource.name}</h3>
                                                            <p className="text-sm text-slate-400 capitalize">{resource.type}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusConfig[resource.status].color}`}>
                                                        {statusConfig[resource.status].label}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Quantity</p>
                                                        <p className="text-lg font-semibold text-white">{resource.quantity} <span className="text-sm text-slate-400">{resource.unit}</span></p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Location</p>
                                                        <p className="text-sm text-white">{resource.location}</p>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-700 pt-4 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Building2 className="h-4 w-4 text-slate-500" />
                                                        <span className="text-sm text-slate-300">{resource.organization}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {resource.contactPhone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {resource.contactEmail}
                                                        </span>
                                                    </div>
                                                </div>

                                                {resource.notes && (
                                                    <p className="text-xs text-slate-500 italic mb-4">"{resource.notes}"</p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500">Updated {resource.timestamp}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingResource(resource);
                                                                setResourceForm({
                                                                    type: resource.type,
                                                                    name: resource.name,
                                                                    quantity: resource.quantity,
                                                                    unit: resource.unit,
                                                                    location: resource.location,
                                                                    coordinates: resource.coordinates,
                                                                    organization: resource.organization,
                                                                    contactName: resource.contactName,
                                                                    contactPhone: resource.contactPhone,
                                                                    contactEmail: resource.contactEmail,
                                                                    status: resource.status,
                                                                    notes: resource.notes,
                                                                });
                                                                setShowResourceForm(true);
                                                            }}
                                                            className="rounded-lg border border-slate-600 bg-slate-700/50 p-2 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-colors"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await resourcesApi.delete(resource.id);
                                                                    setResources(prev => prev.filter(r => r.id !== resource.id));
                                                                } catch (error) {
                                                                    console.error('Error deleting resource:', error);
                                                                }
                                                            }}
                                                            className="rounded-lg border border-red-600/30 bg-red-600/10 p-2 text-red-400 hover:bg-red-600/20 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredResources.length === 0 && (
                                        <div className="col-span-2 px-6 py-12 text-center rounded-lg border border-slate-700 bg-slate-800/50">
                                            <Search className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                                            <p className="text-slate-400">No resources found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resource Form Modal */}
                        {showResourceForm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                                    <div className="border-b border-slate-700 p-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-white">
                                                {editingResource ? 'Edit Resource' : 'Add New Resource'}
                                            </h2>
                                            <button
                                                onClick={() => setShowResourceForm(false)}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {editingResource ? 'Update resource information' : 'Register materials available for disaster relief'}
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Resource Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Resource Type</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { type: 'boat', icon: Anchor, label: 'Boat' },
                                                    { type: 'food', icon: Utensils, label: 'Food' },
                                                    { type: 'clothing', icon: Shirt, label: 'Clothing' },
                                                    { type: 'medical', icon: Pill, label: 'Medical' },
                                                    { type: 'water', icon: Droplets, label: 'Water' },
                                                    { type: 'shelter', icon: Home, label: 'Shelter' },
                                                    { type: 'transport', icon: Truck, label: 'Transport' },
                                                    { type: 'other', icon: Package, label: 'Other' },
                                                ].map(({ type, icon: Icon, label }) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setResourceForm(prev => ({ ...prev, type: type as ResourceType }))}
                                                        className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                                                            resourceForm.type === type
                                                                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-400'
                                                                : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                        <span className="text-xs font-medium">{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Resource Name and Quantity */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Resource Name</label>
                                                <input
                                                    type="text"
                                                    value={resourceForm.name}
                                                    onChange={(e) => setResourceForm(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="e.g., Emergency Food Packs"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={resourceForm.quantity}
                                                        onChange={(e) => setResourceForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                                        placeholder="0"
                                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                                                    <input
                                                        type="text"
                                                        value={resourceForm.unit}
                                                        onChange={(e) => setResourceForm(prev => ({ ...prev, unit: e.target.value }))}
                                                        placeholder="e.g., packs, units"
                                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                                <input
                                                    type="text"
                                                    value={resourceForm.location}
                                                    onChange={(e) => setResourceForm(prev => ({ ...prev, location: e.target.value }))}
                                                    placeholder="e.g., George Town Relief Center"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">GPS Coordinates</label>
                                                <input
                                                    type="text"
                                                    value={resourceForm.coordinates}
                                                    readOnly
                                                    placeholder="Choose on map to auto-fill"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLocationSearchQuery(resourceForm.location || '');
                                                        setShowLocationPicker(true);
                                                    }}
                                                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
                                                >
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    Open Google Map Picker
                                                </button>
                                            </div>
                                        </div>

                                        {/* Organization */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Organization / NGO Name</label>
                                            <input
                                                type="text"
                                                value={resourceForm.organization}
                                                onChange={(e) => setResourceForm(prev => ({ ...prev, organization: e.target.value }))}
                                                placeholder="e.g., Malaysian Red Crescent"
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        {/* Contact Information */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Name</label>
                                                <input
                                                    type="text"
                                                    value={resourceForm.contactName}
                                                    onChange={(e) => setResourceForm(prev => ({ ...prev, contactName: e.target.value }))}
                                                    placeholder="Contact person"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={resourceForm.contactPhone}
                                                    onChange={(e) => setResourceForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                                                    placeholder="+60 12-345-6789"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={resourceForm.contactEmail}
                                                    onChange={(e) => setResourceForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                                    placeholder="email@organization.org"
                                                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Availability Status</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { status: 'available', label: 'Available', color: 'emerald' },
                                                    { status: 'limited', label: 'Limited', color: 'amber' },
                                                    { status: 'reserved', label: 'Reserved', color: 'blue' },
                                                    { status: 'depleted', label: 'Depleted', color: 'red' },
                                                ].map(({ status, label, color }) => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        onClick={() => setResourceForm(prev => ({ ...prev, status: status as Resource['status'] }))}
                                                        className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                                                            resourceForm.status === status
                                                                ? `border-${color}-500 bg-${color}-600/20 text-${color}-400`
                                                                : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes</label>
                                            <textarea
                                                value={resourceForm.notes}
                                                onChange={(e) => setResourceForm(prev => ({ ...prev, notes: e.target.value }))}
                                                placeholder="Any additional details about this resource..."
                                                rows={3}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700 p-6 flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => setShowResourceForm(false)}
                                            className="rounded-lg border border-slate-600 bg-slate-700/50 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600/50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const parsedCoordinates = parseCoordinateText(resourceForm.coordinates);
                                                    const resourceData = {
                                                        type: resourceForm.type,
                                                        name: resourceForm.name,
                                                        quantity: resourceForm.quantity,
                                                        unit: resourceForm.unit,
                                                        location: resourceForm.location,
                                                        coordinates: resourceForm.coordinates || null,
                                                        latitude: parsedCoordinates?.latitude ?? null,
                                                        longitude: parsedCoordinates?.longitude ?? null,
                                                        organization: resourceForm.organization,
                                                        contactName: resourceForm.contactName,
                                                        contactPhone: resourceForm.contactPhone || null,
                                                        contactEmail: resourceForm.contactEmail || null,
                                                        status: resourceForm.status,
                                                        notes: resourceForm.notes || null,
                                                    };

                                                    if (editingResource) {
                                                        // Update existing resource
                                                        const updated = await resourcesApi.update(editingResource.id, resourceData);
                                                        setResources(prev => prev.map(r => 
                                                            r.id === editingResource.id 
                                                                ? {
                                                                    id: updated.id,
                                                                    type: updated.type,
                                                                    name: updated.name,
                                                                    quantity: updated.quantity,
                                                                    unit: updated.unit,
                                                                    location: updated.location,
                                                                    coordinates: updated.coordinates || '',
                                                                    organization: updated.organization,
                                                                    contactName: updated.contactName,
                                                                    contactPhone: updated.contactPhone || '',
                                                                    contactEmail: updated.contactEmail || '',
                                                                    status: updated.status,
                                                                    notes: updated.notes || '',
                                                                    timestamp: updated.timestamp,
                                                                }
                                                                : r
                                                        ));
                                                    } else {
                                                        // Add new resource
                                                        const created = await resourcesApi.create(resourceData);
                                                        const newResource: Resource = {
                                                            id: created.id,
                                                            type: created.type,
                                                            name: created.name,
                                                            quantity: created.quantity,
                                                            unit: created.unit,
                                                            location: created.location,
                                                            coordinates: created.coordinates || '',
                                                            organization: created.organization,
                                                            contactName: created.contactName,
                                                            contactPhone: created.contactPhone || '',
                                                            contactEmail: created.contactEmail || '',
                                                            status: created.status,
                                                            notes: created.notes || '',
                                                            timestamp: created.timestamp,
                                                        };
                                                        setResources(prev => [newResource, ...prev]);
                                                    }
                                                    setShowResourceForm(false);
                                                } catch (error) {
                                                    console.error('Error saving resource:', error);
                                                }
                                            }}
                                            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                        >
                                            {editingResource ? 'Update Resource' : 'Add Resource'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLocationPicker && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="w-full max-w-4xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
                                    <div className="border-b border-slate-700 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Pick Resource Location</h3>
                                                <p className="text-xs text-slate-400">Search address or click on map to auto-fill GPS coordinates.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowLocationPicker(false)}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={locationSearchQuery}
                                                onChange={(e) => setLocationSearchQuery(e.target.value)}
                                                placeholder="Search address (e.g., Komtar, Penang)"
                                                className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void searchLocationOnMap()}
                                                disabled={isSearchingLocation}
                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                            >
                                                {isSearchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                Search
                                            </button>
                                        </div>

                                        <div ref={locationPickerMapRef} className="h-[420px] w-full rounded-lg border border-slate-700" />

                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-400">
                                                {selectedPickerPoint
                                                    ? `Selected: ${formatCoordinateText(selectedPickerPoint.lat, selectedPickerPoint.lng)}`
                                                    : 'No point selected yet'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowLocationPicker(false)}
                                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                            >
                                                Use this location
                                            </button>
                                        </div>
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

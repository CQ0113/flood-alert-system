import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Mail,
    Send,
    MapPin,
    Clock,
    Shield,
    CloudRain,
    Waves,
    Wind,
    ThermometerSun,
    ChevronRight,
    CheckCircle,
    Radio,
    Phone,
    FileText,
    Camera,
    Navigation,
    Info,
    ExternalLink,
    Loader2,
    X,
    Menu,
    Home,
    AlertCircle,
    Package,
    Search,
    Truck,
    Utensils,
    Shirt,
    Pill,
    Anchor,
    Droplets,
    Building2,
    Filter,
    Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    resourcesApi,
    disasterAlertsApi,
    subscriptionsApi,
    type Resource as ApiResource,
    type DisasterAlert as ApiDisasterAlert,
} from '@/lib/api';

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
    distance?: string;
}

interface DisasterAlert {
    id: number;
    type: 'flood' | 'storm' | 'landslide' | 'haze' | 'heatwave';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: string;
    issuedAt: string;
    validUntil: string;
    instructions: string[];
}

export default function ClientPortal() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [email, setEmail] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [subscribeMethod, setSubscribeMethod] = useState<'email' | 'telegram' | 'both'>('email');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscribeSuccess, setSubscribeSuccess] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<DisasterAlert | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [resourceSearch, setResourceSearch] = useState('');
    const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | 'all'>('all');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // State for data from API
    const [resources, setResources] = useState<Resource[]>([]);
    const [alerts, setAlerts] = useState<DisasterAlert[]>([]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [resourcesData, alertsData] = await Promise.all([
                    resourcesApi.getAll(),
                    disasterAlertsApi.getAll(),
                ]);

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

                setAlerts(alertsData.map((a: ApiDisasterAlert) => ({
                    id: a.id,
                    type: a.type,
                    severity: a.severity,
                    title: a.title,
                    description: a.description,
                    location: a.location,
                    issuedAt: a.issuedAt,
                    validUntil: a.validUntil,
                    instructions: a.instructions,
                })));
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter resources based on search and type
    const filteredResources = resources.filter(resource => {
        const matchesSearch = resourceSearch === '' || 
            resource.location.toLowerCase().includes(resourceSearch.toLowerCase()) ||
            resource.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
            resource.organization.toLowerCase().includes(resourceSearch.toLowerCase());
        const matchesType = resourceTypeFilter === 'all' || resource.type === resourceTypeFilter;
        return matchesSearch && matchesType && resource.status !== 'depleted';
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubscribing(true);
        try {
            await subscriptionsApi.create({
                email: subscribeMethod === 'telegram' ? undefined : email,
                telegram_id: subscribeMethod === 'email' ? undefined : telegramId,
                method: subscribeMethod,
            });
            setSubscribeSuccess(true);
            setEmail('');
            setTelegramId('');
            setTimeout(() => setSubscribeSuccess(false), 5000);
        } catch (error) {
            console.error('Error subscribing:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const getSeverityConfig = (severity: DisasterAlert['severity']) => {
        const configs = {
            critical: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', label: 'CRITICAL', lightBg: 'bg-red-500/10' },
            high: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400', label: 'HIGH', lightBg: 'bg-amber-500/10' },
            medium: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400', label: 'MEDIUM', lightBg: 'bg-yellow-500/10' },
            low: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400', label: 'LOW', lightBg: 'bg-blue-500/10' },
        };
        return configs[severity];
    };

    const getTypeIcon = (type: DisasterAlert['type']) => {
        const icons = {
            flood: Waves,
            storm: CloudRain,
            landslide: AlertTriangle,
            haze: Wind,
            heatwave: ThermometerSun,
        };
        return icons[type];
    };

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');

    return (
        <>
            <Head title="CuacaGuard - Disaster Alert Portal" />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {isLoading && (
                    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-300">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                            <span className="text-sm">Loading disaster alerts and resources...</span>
                        </div>
                    </div>
                )}

                {/* Critical Alert Banner */}
                {criticalAlerts.length > 0 && (
                    <div className="bg-red-600 text-white py-2 px-4">
                        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                            <AlertCircle className="h-5 w-5 animate-pulse" />
                            <span className="font-semibold">CRITICAL ALERT:</span>
                            <span>{criticalAlerts[0].title}</span>
                            <button
                                onClick={() => setSelectedAlert(criticalAlerts[0])}
                                className="ml-4 underline hover:no-underline text-sm"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">CuacaGuard</h1>
                                    <p className="text-xs text-slate-400">ASEAN Early Warning</p>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-6">
                                <a href="#alerts" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Alerts
                                </a>
                                <a href="#resources" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Resources
                                </a>
                                <a href="#subscribe" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    Subscribe
                                </a>
                                <a href="#report" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    Report
                                </a>
                                <Link
                                    href="/report"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Submit Report
                                </Link>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-slate-400 hover:text-white"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden py-4 border-t border-slate-700">
                                <div className="flex flex-col gap-4">
                                    <a href="#alerts" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Alerts
                                    </a>
                                    <a href="#resources" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Resources
                                    </a>
                                    <a href="#subscribe" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        Subscribe
                                    </a>
                                    <a href="#report" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                                        <Camera className="h-4 w-4" />
                                        Report
                                    </a>
                                    <Link
                                        href="/report"
                                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 w-fit"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Submit Report
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-teal-600/10"></div>
                    <div className="max-w-7xl mx-auto relative">
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
                                <Radio className="h-4 w-4 animate-pulse" />
                                <span className="text-sm font-medium">LIVE MONITORING</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Stay Safe. Stay Informed.
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                                Real-time disaster alerts and early warnings for Penang, Malaysia. Subscribe to receive instant notifications when disasters strike.
                            </p>
                        </div>

                        {/* Live Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center backdrop-blur-sm">
                                <p className="text-3xl font-bold text-white">{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}</p>
                                <p className="text-sm text-slate-400">Active Alerts</p>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center backdrop-blur-sm">
                                <p className="text-3xl font-bold text-emerald-400">24/7</p>
                                <p className="text-sm text-slate-400">Monitoring</p>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center backdrop-blur-sm">
                                <p className="text-3xl font-bold text-amber-400">&lt;5min</p>
                                <p className="text-sm text-slate-400">Alert Speed</p>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center backdrop-blur-sm">
                                <p className="text-3xl font-bold text-blue-400">12K+</p>
                                <p className="text-sm text-slate-400">Subscribers</p>
                            </div>
                        </div>

                        {/* Current Time */}
                        <div className="text-center mt-8">
                            <p className="text-2xl font-mono font-semibold text-emerald-400">{formatTime(currentTime)}</p>
                            <p className="text-sm text-slate-400">{formatDate(currentTime)}</p>
                        </div>
                    </div>
                </section>

                {/* Active Alerts Section */}
                <section id="alerts" className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <AlertTriangle className="h-7 w-7 text-amber-400" />
                                    Active Disaster Alerts
                                </h2>
                                <p className="text-slate-400 mt-1">Current warnings and advisories in your area</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
                                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                                <span className="text-sm text-slate-300">Live Updates</span>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {alerts.map((alert) => {
                                const severityConfig = getSeverityConfig(alert.severity);
                                const TypeIcon = getTypeIcon(alert.type);

                                return (
                                    <div
                                        key={alert.id}
                                        className={`rounded-xl border ${severityConfig.border}/30 ${severityConfig.lightBg} p-5 hover:border-opacity-50 transition-all cursor-pointer`}
                                        onClick={() => setSelectedAlert(alert)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`rounded-xl ${severityConfig.bg}/20 p-3`}>
                                                <TypeIcon className={`h-6 w-6 ${severityConfig.text}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`rounded-full ${severityConfig.bg} px-3 py-1 text-xs font-bold text-white`}>
                                                                {severityConfig.label}
                                                            </span>
                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {alert.issuedAt}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-semibold text-white mb-1">{alert.title}</h3>
                                                        <p className="text-sm text-slate-400 flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            {alert.location}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <p className="text-slate-300 mt-3 line-clamp-2">{alert.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Subscribe Section */}
                <section id="subscribe" className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <Bell className="h-7 w-7 text-emerald-400" />
                                Get Instant Alerts
                            </h2>
                            <p className="text-slate-400 mt-2">
                                Subscribe to receive disaster warnings via Email or Telegram. Be the first to know when emergencies happen.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 md:p-8">
                            {subscribeSuccess ? (
                                <div className="text-center py-8">
                                    <div className="rounded-full bg-emerald-500/20 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Subscription Successful!</h3>
                                    <p className="text-slate-400">
                                        You will now receive disaster alerts. Stay safe!
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe}>
                                    {/* Subscription Method Toggle */}
                                    <div className="flex justify-center gap-2 mb-6">
                                        {[
                                            { value: 'email', icon: Mail, label: 'Email' },
                                            { value: 'telegram', icon: Send, label: 'Telegram' },
                                            { value: 'both', icon: Bell, label: 'Both' },
                                        ].map(({ value, icon: Icon, label }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setSubscribeMethod(value as typeof subscribeMethod)}
                                                className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors ${
                                                    subscribeMethod === value
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                                        {/* Email Input */}
                                        {(subscribeMethod === 'email' || subscribeMethod === 'both') && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="your@email.com"
                                                        required={subscribeMethod === 'email' || subscribeMethod === 'both'}
                                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Telegram Input */}
                                        {(subscribeMethod === 'telegram' || subscribeMethod === 'both') && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Telegram Username
                                                </label>
                                                <div className="relative">
                                                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={telegramId}
                                                        onChange={(e) => setTelegramId(e.target.value)}
                                                        placeholder="@username"
                                                        required={subscribeMethod === 'telegram' || subscribeMethod === 'both'}
                                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Telegram Bot Info */}
                                    {(subscribeMethod === 'telegram' || subscribeMethod === 'both') && (
                                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 mb-6">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-300">
                                                    <p className="font-medium text-blue-400 mb-1">Connect with our Telegram Bot</p>
                                                    <p>After subscribing, start a chat with <span className="font-mono bg-slate-700 px-2 py-0.5 rounded">@CuacaGuardBot</span> on Telegram and send <span className="font-mono bg-slate-700 px-2 py-0.5 rounded">/start</span> to activate alerts.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Location Preference */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Alert Region
                                        </label>
                                        <select className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-3 px-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                                            <option value="penang">Penang (All Areas)</option>
                                            <option value="george-town">George Town</option>
                                            <option value="bayan-lepas">Bayan Lepas</option>
                                            <option value="air-itam">Air Itam</option>
                                            <option value="seberang-perai">Seberang Perai</option>
                                            <option value="butterworth">Butterworth</option>
                                        </select>
                                    </div>

                                    {/* Alert Types */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-300 mb-3">
                                            Alert Types
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { type: 'flood', icon: Waves, label: 'Floods' },
                                                { type: 'storm', icon: CloudRain, label: 'Storms' },
                                                { type: 'landslide', icon: AlertTriangle, label: 'Landslides' },
                                                { type: 'haze', icon: Wind, label: 'Haze' },
                                                { type: 'heatwave', icon: ThermometerSun, label: 'Heatwave' },
                                            ].map(({ type, icon: Icon, label }) => (
                                                <label
                                                    key={type}
                                                    className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 cursor-pointer hover:border-emerald-500/50 transition-colors"
                                                >
                                                    <input type="checkbox" defaultChecked className="rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 bg-slate-600" />
                                                    <Icon className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm text-slate-300">{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubscribing}
                                        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubscribing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Subscribing...
                                            </>
                                        ) : (
                                            <>
                                                <Bell className="h-4 w-4" />
                                                Subscribe to Alerts
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                {/* Report Section */}
                <section id="report" className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <Camera className="h-7 w-7 text-amber-400" />
                                Report a Hazard
                            </h2>
                            <p className="text-slate-400 mt-2">
                                Help keep your community safe by reporting hazards in your area
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {/* Quick Report Card */}
                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 hover:border-emerald-500/50 transition-colors">
                                <div className="rounded-xl bg-red-500/20 w-14 h-14 flex items-center justify-center mb-4">
                                    <Waves className="h-7 w-7 text-red-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Flood</h3>
                                <p className="text-sm text-slate-400 mb-4">Report rising water levels, flooded roads, or affected areas</p>
                                <Link
                                    href="/report?type=flood"
                                    className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1"
                                >
                                    Report Now <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 hover:border-emerald-500/50 transition-colors">
                                <div className="rounded-xl bg-amber-500/20 w-14 h-14 flex items-center justify-center mb-4">
                                    <AlertTriangle className="h-7 w-7 text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Road Hazard</h3>
                                <p className="text-sm text-slate-400 mb-4">Report fallen trees, debris, or blocked roads</p>
                                <Link
                                    href="/report?type=road"
                                    className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1"
                                >
                                    Report Now <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 hover:border-emerald-500/50 transition-colors">
                                <div className="rounded-xl bg-purple-500/20 w-14 h-14 flex items-center justify-center mb-4">
                                    <Navigation className="h-7 w-7 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Other Hazard</h3>
                                <p className="text-sm text-slate-400 mb-4">Report power outages, structural damage, or other emergencies</p>
                                <Link
                                    href="/report?type=other"
                                    className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1"
                                >
                                    Report Now <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Full Report Button */}
                        <div className="text-center mt-8">
                            <Link
                                href="/report"
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-medium text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
                            >
                                <FileText className="h-5 w-5" />
                                Submit Full Report
                                <ExternalLink className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Resources & Aid Section */}
                <section id="resources" className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                                <Package className="h-7 w-7 text-emerald-400" />
                                Find Resources & Aid
                            </h2>
                            <p className="text-slate-400 mt-2">
                                Locate nearby relief resources from volunteers and NGOs
                            </p>
                        </div>

                        {/* Search and Filter */}
                        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={resourceSearch}
                                        onChange={(e) => setResourceSearch(e.target.value)}
                                        placeholder="Search by location, resource name, or organization..."
                                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 py-3 pl-10 pr-4 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                {/* Type Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-slate-400" />
                                    <select
                                        value={resourceTypeFilter}
                                        onChange={(e) => setResourceTypeFilter(e.target.value as ResourceType | 'all')}
                                        className="rounded-lg border border-slate-600 bg-slate-700/50 py-3 px-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="boat">Boats</option>
                                        <option value="food">Food</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="medical">Medical</option>
                                        <option value="water">Water</option>
                                        <option value="shelter">Shelter</option>
                                        <option value="transport">Transport</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Quick Filter Pills */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {[
                                    { type: 'all', icon: Package, label: 'All' },
                                    { type: 'boat', icon: Anchor, label: 'Boats' },
                                    { type: 'food', icon: Utensils, label: 'Food' },
                                    { type: 'water', icon: Droplets, label: 'Water' },
                                    { type: 'medical', icon: Pill, label: 'Medical' },
                                    { type: 'shelter', icon: Home, label: 'Shelter' },
                                ].map(({ type, icon: Icon, label }) => (
                                    <button
                                        key={type}
                                        onClick={() => setResourceTypeFilter(type as ResourceType | 'all')}
                                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                                            resourceTypeFilter === type
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-400 text-sm">
                                Showing <span className="text-white font-semibold">{filteredResources.length}</span> available resources
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin className="h-4 w-4" />
                                Sorted by distance
                            </div>
                        </div>

                        {/* Resources Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredResources.map((resource) => {
                                const typeConfig: Record<ResourceType, { icon: typeof Package; color: string; bg: string }> = {
                                    boat: { icon: Anchor, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                                    food: { icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/20' },
                                    clothing: { icon: Shirt, color: 'text-pink-400', bg: 'bg-pink-500/20' },
                                    medical: { icon: Pill, color: 'text-red-400', bg: 'bg-red-500/20' },
                                    water: { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                                    shelter: { icon: Home, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                                    transport: { icon: Truck, color: 'text-green-400', bg: 'bg-green-500/20' },
                                    other: { icon: Package, color: 'text-slate-400', bg: 'bg-slate-500/20' },
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
                                    <div
                                        key={resource.id}
                                        onClick={() => setSelectedResource(resource)}
                                        className="rounded-xl border border-slate-700 bg-slate-800 p-5 hover:border-emerald-500/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-lg p-2.5 ${config.bg}`}>
                                                    <TypeIcon className={`h-5 w-5 ${config.color}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{resource.name}</h3>
                                                    <p className="text-xs text-slate-400 capitalize">{resource.type}</p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusConfig[resource.status].color}`}>
                                                {statusConfig[resource.status].label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                {resource.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Building2 className="h-4 w-4 text-slate-500" />
                                                {resource.organization}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                            <div className="text-sm">
                                                <span className="text-white font-semibold">{resource.quantity}</span>
                                                <span className="text-slate-400"> {resource.unit}</span>
                                            </div>
                                            {resource.distance && (
                                                <div className="flex items-center gap-1 text-sm text-emerald-400">
                                                    <Navigation className="h-4 w-4" />
                                                    {resource.distance}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredResources.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No resources found matching your criteria</p>
                                <button
                                    onClick={() => { setResourceSearch(''); setResourceTypeFilter('all'); }}
                                    className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Resource Detail Modal */}
                {selectedResource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                            {(() => {
                                const typeConfig: Record<ResourceType, { icon: typeof Package; color: string; bg: string }> = {
                                    boat: { icon: Anchor, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                                    food: { icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/20' },
                                    clothing: { icon: Shirt, color: 'text-pink-400', bg: 'bg-pink-500/20' },
                                    medical: { icon: Pill, color: 'text-red-400', bg: 'bg-red-500/20' },
                                    water: { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                                    shelter: { icon: Home, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                                    transport: { icon: Truck, color: 'text-green-400', bg: 'bg-green-500/20' },
                                    other: { icon: Package, color: 'text-slate-400', bg: 'bg-slate-500/20' },
                                };
                                const config = typeConfig[selectedResource.type];
                                const TypeIcon = config.icon;

                                const statusConfig = {
                                    available: { label: 'Available', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                                    limited: { label: 'Limited', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                                    depleted: { label: 'Depleted', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                                    reserved: { label: 'Reserved', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                                };

                                return (
                                    <>
                                        <div className="p-6 border-b border-slate-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`rounded-xl p-3 ${config.bg}`}>
                                                        <TypeIcon className={`h-7 w-7 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">{selectedResource.name}</h2>
                                                        <p className="text-slate-400 capitalize">{selectedResource.type}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedResource(null)}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${statusConfig[selectedResource.status].color}`}>
                                                    {statusConfig[selectedResource.status].label}
                                                </span>
                                                {selectedResource.distance && (
                                                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                                                        <Navigation className="h-5 w-5" />
                                                        {selectedResource.distance} away
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <p className="text-xs text-slate-500 mb-1">Quantity Available</p>
                                                    <p className="text-2xl font-bold text-white">{selectedResource.quantity} <span className="text-base text-slate-400 font-normal">{selectedResource.unit}</span></p>
                                                </div>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                                                    <p className="text-white flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        {selectedResource.timestamp}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Location</p>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <p className="text-white flex items-center gap-2 mb-2">
                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                        {selectedResource.location}
                                                    </p>
                                                    <p className="text-sm text-slate-400 font-mono">{selectedResource.coordinates}</p>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedResource.location + ', Penang')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Open in Google Maps
                                                    </a>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Organization</p>
                                                <div className="rounded-lg bg-slate-700/50 p-4">
                                                    <p className="text-white flex items-center gap-2 mb-3">
                                                        <Building2 className="h-4 w-4 text-slate-400" />
                                                        {selectedResource.organization}
                                                    </p>
                                                    <div className="space-y-2 text-sm">
                                                        <p className="text-slate-300 flex items-center gap-2">
                                                            <Heart className="h-4 w-4 text-slate-500" />
                                                            {selectedResource.contactName}
                                                        </p>
                                                        <a href={`tel:${selectedResource.contactPhone}`} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                                                            <Phone className="h-4 w-4" />
                                                            {selectedResource.contactPhone}
                                                        </a>
                                                        <a href={`mailto:${selectedResource.contactEmail}`} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
                                                            {selectedResource.contactEmail}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedResource.notes && (
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-2">Additional Notes</p>
                                                    <p className="text-slate-300 italic">"{selectedResource.notes}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-700 p-6 flex items-center justify-between">
                                            <a
                                                href={`tel:${selectedResource.contactPhone}`}
                                                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                            >
                                                <Phone className="h-4 w-4" />
                                                Call Now
                                            </a>
                                            <button
                                                onClick={() => setSelectedResource(null)}
                                                className="rounded-lg border border-slate-600 bg-slate-700/50 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600/50 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Emergency Contacts */}
                <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-white text-center mb-6">Emergency Contacts</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'Emergency', number: '999', icon: Phone },
                                { name: 'Fire & Rescue', number: '994', icon: AlertTriangle },
                                { name: 'Police', number: '999', icon: Shield },
                                { name: 'Civil Defence', number: '03-8064 2400', icon: Home },
                            ].map(({ name, number, icon: Icon }) => (
                                <a
                                    key={name}
                                    href={`tel:${number.replace(/[^0-9]/g, '')}`}
                                    className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center hover:border-emerald-500/50 transition-colors"
                                >
                                    <Icon className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-white font-semibold">{name}</p>
                                    <p className="text-emerald-400 font-mono">{number}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-700 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Shield className="h-6 w-6 text-emerald-400" />
                            <span className="text-lg font-bold text-white">CuacaGuard</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">
                            ASEAN Disaster Early Warning System for Malaysia
                        </p>
                        <div className="flex justify-center gap-6 text-sm text-slate-500">
                            <a href="#" className="hover:text-slate-300">About</a>
                            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-300">Terms of Service</a>
                            <a href="/dashboard" className="hover:text-slate-300">Command Center</a>
                        </div>
                        <p className="text-xs text-slate-600 mt-4">
                            © 2026 CuacaGuard. All rights reserved.
                        </p>
                    </div>
                </footer>

                {/* Alert Detail Modal */}
                {selectedAlert && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                            {(() => {
                                const severityConfig = getSeverityConfig(selectedAlert.severity);
                                const TypeIcon = getTypeIcon(selectedAlert.type);
                                return (
                                    <>
                                        <div className={`${severityConfig.lightBg} border-b ${severityConfig.border}/30 p-6`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`rounded-xl ${severityConfig.bg}/20 p-3`}>
                                                        <TypeIcon className={`h-8 w-8 ${severityConfig.text}`} />
                                                    </div>
                                                    <div>
                                                        <span className={`rounded-full ${severityConfig.bg} px-3 py-1 text-xs font-bold text-white`}>
                                                            {severityConfig.label}
                                                        </span>
                                                        <h2 className="text-xl font-bold text-white mt-2">{selectedAlert.title}</h2>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedAlert(null)}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Location</p>
                                                    <p className="text-white flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                        {selectedAlert.location}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Issued</p>
                                                    <p className="text-white flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        {selectedAlert.issuedAt}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Valid Until</p>
                                                <p className="text-amber-400 font-medium">{selectedAlert.validUntil}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500 mb-2">Description</p>
                                                <p className="text-slate-300">{selectedAlert.description}</p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500 mb-3">Safety Instructions</p>
                                                <ul className="space-y-2">
                                                    {selectedAlert.instructions.map((instruction, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                                            <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                            {instruction}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 p-6 flex items-center justify-between">
                                            <a
                                                href="tel:999"
                                                className="flex items-center gap-2 text-red-400 hover:text-red-300"
                                            >
                                                <Phone className="h-4 w-4" />
                                                Emergency: 999
                                            </a>
                                            <button
                                                onClick={() => setSelectedAlert(null)}
                                                className="rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

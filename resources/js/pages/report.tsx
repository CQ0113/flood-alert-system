import { Head } from '@inertiajs/react';
import {
    Camera,
    MapPin,
    AlertCircle,
    CheckCircle,
    Upload,
    Clock,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { reportsApi, type Report as ApiReport } from '@/lib/api';

interface NearbyReport {
    id: number;
    type: string;
    location: string;
    time: string;
    verified: boolean;
}

export default function Report() {
    // Form state
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [hazardType, setHazardType] = useState<string>('');
    const [location] = useState<string>('5.4141° N, 100.3288° E');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Nearby reports from API
    const [nearbyReports, setNearbyReports] = useState<NearbyReport[]>([]);

    // Fetch nearby reports on mount
    useEffect(() => {
        const fetchNearbyReports = async () => {
            try {
                const reports = await reportsApi.getAll();
                setNearbyReports(reports.slice(0, 5).map((r: ApiReport) => ({
                    id: r.id,
                    type: r.typeLabel,
                    location: r.location,
                    time: r.timestamp,
                    verified: r.status === 'verified',
                })));
            } catch (error) {
                console.error('Error fetching nearby reports:', error);
            }
        };

        fetchNearbyReports();
    }, []);

    const hazardTypes = [
        { value: 'water-rising', label: 'Water Level Rising' },
        { value: 'low-visibility', label: 'Low Visibility' },
        { value: 'blocked-road', label: 'Blocked Road' },
        { value: 'structural-damage', label: 'Structural Damage' },
        { value: 'other', label: 'Other Hazard' },
    ];

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async () => {
        if (!photo || !hazardType) {
            alert('Please upload a photo and select a hazard type');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            formData.append('image', photo);
            formData.append('type', hazardType);
            formData.append('location', 'George Town');
            formData.append('coordinates', location);
            formData.append('latitude', '5.4141');
            formData.append('longitude', '100.3288');
            
            await reportsApi.create(formData);
            
            setSubmitSuccess(true);
            
            // Reset after showing success
            setTimeout(() => {
                setSubmitSuccess(false);
                setPhoto(null);
                setPhotoPreview(null);
                setHazardType('');
            }, 3000);
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Error submitting report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <Head title="Emergency Report - CuacaGuard" />
            <div className="min-h-screen bg-slate-50">
                {/* Sticky Header */}
                <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Emergency Report</h1>
                                <p className="text-xs text-slate-500">CuacaGuard</p>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 animate-pulse">
                            <span className="text-sm font-bold text-white">SOS</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="px-4 py-4 pb-8 max-w-lg mx-auto">
                    {/* Current Context Banner */}
                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Current Official Forecast:</span> Thunderstorms
                            </p>
                        </div>
                    </div>

                    {/* Success Message */}
                    {submitSuccess && (
                        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-emerald-800">Report Submitted!</p>
                                    <p className="text-sm text-emerald-700">AI validation in progress...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Photo Upload Zone */}
                    <div className="mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleUploadClick}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="w-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 transition-all hover:border-blue-400 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
                        >
                            {photoPreview ? (
                                <div className="relative">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="mx-auto max-h-[140px] rounded-lg object-cover"
                                    />
                                    <p className="mt-3 text-sm text-slate-600">Tap to change photo</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                        <Camera className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-base font-semibold text-slate-700">
                                        Tap to Upload Photo of Hazard
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Flood / Haze / Damage
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Or drag and drop</span>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Hazard Type Dropdown */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Hazard Type
                        </label>
                        <div className="relative">
                            <select
                                value={hazardType}
                                onChange={(e) => setHazardType(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-4 pr-10 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select hazard type...</option>
                                {hazardTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Location Input (Auto-filled) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Your Location (Auto-detected)
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />
                            <input
                                type="text"
                                value={location}
                                readOnly
                                className="w-full rounded-xl border border-slate-300 bg-slate-100 py-4 pl-12 pr-4 text-base text-slate-700 cursor-not-allowed"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                GPS
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || submitSuccess}
                        className="w-full rounded-xl bg-emerald-500 px-6 py-5 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting...
                            </span>
                        ) : submitSuccess ? (
                            <span className="flex items-center justify-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Submitted!
                            </span>
                        ) : (
                            'Submit to AI Validator'
                        )}
                    </button>

                    {/* Recent Activity Feed */}
                    <div className="mt-8">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Nearby Verified Reports
                        </h2>
                        <div className="space-y-3">
                            {nearbyReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3"
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                        report.verified ? 'bg-emerald-100' : 'bg-slate-100'
                                    }`}>
                                        {report.verified ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {report.type}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {report.location}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{report.time}</p>
                                        {report.verified && (
                                            <span className="text-xs font-medium text-emerald-600">Verified</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Safety Notice */}
                    <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                        <p className="text-xs text-blue-700 text-center">
                            <span className="font-medium">Stay Safe:</span> Only report if you're in a safe location. 
                            Your report helps others avoid danger.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}

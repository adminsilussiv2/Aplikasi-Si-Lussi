import React, { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Eye,
  Compass,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  RiverInspection,
  parseCoordString,
} from '../types/silussi';

interface InspectionMapPreviewProps {
  inspections: RiverInspection[];
  onSelectInspection: (inspection: RiverInspection) => void;
}

export const InspectionMapPreview: React.FC<InspectionMapPreviewProps> = ({
  inspections,
  onSelectInspection,
}) => {
  const [activePinId, setActivePinId] = useState<string | null>(
    inspections[0]?.id || null
  );
  const [mapCategoryFilter, setMapCategoryFilter] = useState<
    'ALL' | 'fisik_sungai' | 'kinerja_prasarana'
  >('ALL');
  const [selectedBalai, setSelectedBalai] = useState<string>('ALL');
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [coordFocus, setCoordFocus] = useState<'awal' | 'akhir'>('awal');
  const [sdkAuthFailed, setSdkAuthFailed] = useState(false);

  const rawApiKey = (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  ).trim();
  const isStandardGcpKey = rawApiKey.startsWith('AIza') && rawApiKey.length > 25;

  useEffect(() => {
    const prevAuthFailure = (window as unknown as Record<string, unknown>)
      .gm_authFailure;
    (window as unknown as Record<string, unknown>).gm_authFailure = () => {
      setSdkAuthFailed(true);
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };
    return () => {
      (window as unknown as Record<string, unknown>).gm_authFailure =
        prevAuthFailure;
    };
  }, []);

  const plottedItems = useMemo(() => {
    return inspections
      .filter((item) => {
        if (
          mapCategoryFilter !== 'ALL' &&
          (item.category || 'fisik_sungai') !== mapCategoryFilter
        ) {
          return false;
        }
        if (selectedBalai !== 'ALL' && item.balaiPsda !== selectedBalai) {
          return false;
        }
        return true;
      })
      .map((item, idx) => {
        const start = parseCoordString(item.koordinatAwal) || {
          lat: -7.05 - (idx % 4) * 0.12,
          lng: 109.25 + (idx % 5) * 0.35,
        };
        const end = parseCoordString(item.koordinatAkhir) || {
          lat: start.lat + 0.03,
          lng: start.lng + 0.03,
        };

        return {
          inspection: item,
          start,
          end,
        };
      });
  }, [inspections, mapCategoryFilter, selectedBalai]);

  const activePlotted = useMemo(() => {
    if (!plottedItems.length) return null;
    return (
      plottedItems.find((p) => p.inspection.id === activePinId) ||
      plottedItems[0]
    );
  }, [plottedItems, activePinId]);

  const activeCenter = useMemo(() => {
    if (!activePlotted) {
      return { lat: -7.150975, lng: 110.140259 }; // Central Java center
    }
    return coordFocus === 'awal' ? activePlotted.start : activePlotted.end;
  }, [activePlotted, coordFocus]);

  const activePhoto = useMemo(() => {
    if (!activePlotted) return null;
    for (const subVal of Object.values(activePlotted.inspection.subValues || {})) {
      if (subVal?.photos && subVal.photos.length > 0) {
        return subVal.photos[0];
      }
    }
    for (const doc of Object.values(activePlotted.inspection.componentDocs || {})) {
      if (doc?.photos && doc.photos.length > 0) {
        return doc.photos[0];
      }
    }
    return null;
  }, [activePlotted]);

  const googleEmbedUrl = useMemo(() => {
    const tParam = mapStyle === 'satellite' ? 'k' : 'm';
    const zoom = activePlotted ? 13 : 8;
    return `https://maps.google.com/maps?q=${activeCenter.lat},${activeCenter.lng}&t=${tParam}&z=${zoom}&hl=id&output=embed`;
  }, [activeCenter.lat, activeCenter.lng, mapStyle, activePlotted]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Map Header Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#1B65A6]">
            Google Maps Geospasial Sumber Daya Air Jawa Tengah
          </div>
          <h2 className="font-display text-base font-bold text-[#0B2C5F] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#1B65A6]" />
            Peta Google Maps Sebaran Data Inspeksi Sungai &amp; Kinerja Prasarana
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan lokasi Google Maps dari {plottedItems.length} data inspeksi yang telah diinput
            {selectedBalai !== 'ALL' ? ` pada ${selectedBalai}` : ''}. Pilih titik lokasi di bawah peta untuk memfokuskan koordinat.
          </p>
        </div>

        {/* Balai PSDA Dropdown Filter, Category Filter & Map Type Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBalai}
            onChange={(e) => setSelectedBalai(e.target.value)}
            aria-label="Filter Peta Berdasarkan Balai PSDA"
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B2C5F] focus:border-[#1B65A6] outline-none cursor-pointer"
          >
            <option value="ALL">Semua Balai PSDA (4 Balai)</option>
            {BALAI_PSDA_OPTIONS.map((balai) => (
              <option key={balai} value={balai}>
                {balai}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMapCategoryFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mapCategoryFilter === 'ALL'
                  ? 'bg-[#0B2C5F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({plottedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMapCategoryFilter('fisik_sungai')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mapCategoryFilter === 'fisik_sungai'
                  ? 'bg-[#0B2C5F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kondisi Fisik Sungai
            </button>
            <button
              type="button"
              onClick={() => setMapCategoryFilter('kinerja_prasarana')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mapCategoryFilter === 'kinerja_prasarana'
                  ? 'bg-[#0B2C5F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kinerja Prasarana
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setMapStyle((prev) =>
                prev === 'roadmap' ? 'satellite' : 'roadmap'
              )
            }
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-[#1B65A6]" />
            {mapStyle === 'roadmap' ? 'Satelit Google Maps' : 'Peta Jalan'}
          </button>
        </div>
      </div>

      {/* Google Map Viewport + Selected Inspection Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 8 Columns: Interactive Google Maps Viewport + Quick Coordinate Pin Selector */}
        <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200">
          {/* Google Maps Canvas (Explicit Height for CF2) */}
          <div className="w-full h-[380px] relative bg-slate-200">
            {isStandardGcpKey && !sdkAuthFailed ? (
              <APIProvider
                apiKey={rawApiKey}
                language="id"
                region="ID"
                libraries={['marker']}
              >
                <Map
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  defaultCenter={{ lat: -7.150975, lng: 110.140259 }}
                  center={activeCenter}
                  defaultZoom={9}
                  mapTypeId={mapStyle}
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  className="w-full h-full"
                >
                  {plottedItems.map((item) => {
                    const { inspection, start } = item;
                    const pinColor =
                      inspection.nkfTotal > 70
                        ? '#10B981'
                        : inspection.nkfTotal >= 50
                        ? '#F59E0B'
                        : '#EF4444';

                    return (
                      <AdvancedMarker
                        key={inspection.id}
                        position={start}
                        onClick={() => setActivePinId(inspection.id)}
                        title={`${inspection.namaSungai} (${inspection.nkfTotal.toFixed(1)}%)`}
                      >
                        <Pin
                          background={pinColor}
                          borderColor="#FFFFFF"
                          glyphColor="#FFFFFF"
                        />
                      </AdvancedMarker>
                    );
                  })}
                </Map>
              </APIProvider>
            ) : (
              <iframe
                key={`${activeCenter.lat}-${activeCenter.lng}-${mapStyle}`}
                title="Peta Google Maps Sebaran Inspeksi Si-Lussi"
                src={googleEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>

          {/* Interactive Pin Bar Below Google Map to Switch Between All Inputted Inspections */}
          <div className="p-3.5 bg-slate-900 text-white space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-mono uppercase tracking-wider text-sky-300">
                Daftar Titik Koordinat pada Google Maps ({plottedItems.length} Lokasi):
              </span>
              <div className="flex items-center gap-3 text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  &gt;70% Baik
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  50–70% Cukup
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  &lt;50% Rusak Berat
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {plottedItems.map((item) => {
                const { inspection } = item;
                const isSelected =
                  activePlotted?.inspection.id === inspection.id;
                const dotColor =
                  inspection.nkfTotal > 70
                    ? 'bg-emerald-400'
                    : inspection.nkfTotal >= 50
                    ? 'bg-amber-400'
                    : 'bg-red-400';

                return (
                  <button
                    key={inspection.id}
                    type="button"
                    onClick={() => {
                      setActivePinId(inspection.id);
                      setCoordFocus('awal');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-[#1B65A6] text-white border-sky-300 shadow-xs'
                        : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="font-semibold">{inspection.namaSungai}</span>
                    {inspection.category === 'kinerja_prasarana' &&
                      inspection.namaPrasarana && (
                        <span className="text-[11px] text-sky-200">
                          ({inspection.namaPrasarana})
                        </span>
                      )}
                    <span className="font-mono text-[11px] opacity-85">
                      {inspection.nkfTotal.toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Selected Pin Detail Preview Card */}
        <div className="lg:col-span-4 p-5 bg-slate-50 flex flex-col justify-between">
          {activePlotted ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#1B65A6]">
                  <span>{activePlotted.inspection.kodeInspeksi}</span>
                  <span>{activePlotted.inspection.tanggalPelaksanaan}</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#0B2C5F] mt-1">
                  {activePlotted.inspection.namaSungai}
                </h3>
                {activePlotted.inspection.category === 'kinerja_prasarana' &&
                  activePlotted.inspection.namaPrasarana && (
                    <div className="text-xs font-semibold text-[#1B65A6] mt-0.5">
                      Nama Bangunan: {activePlotted.inspection.namaPrasarana}
                    </div>
                  )}
                <p className="text-xs text-slate-600 mt-0.5">
                  {activePlotted.inspection.noRuas} · Desa{' '}
                  {activePlotted.inspection.desa},{' '}
                  {activePlotted.inspection.kabupatenKota}
                </p>
              </div>

              {/* Switch Google Map Center between Koordinat Awal & Koordinat Akhir */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCoordFocus('awal')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    coordFocus === 'awal'
                      ? 'bg-[#0B2C5F] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  Fokus Titik Awal
                </button>
                <button
                  type="button"
                  onClick={() => setCoordFocus('akhir')}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    coordFocus === 'akhir'
                      ? 'bg-[#0B2C5F] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  Fokus Titik Akhir
                </button>
              </div>

              {/* Photo Thumbnail if available */}
              {activePhoto && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover"
                  />
                  <div className="px-3 py-1.5 text-[11px] text-slate-600 truncate">
                    {activePhoto.caption}
                  </div>
                </div>
              )}

              {/* Coordinate & Score Info */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis Inspeksi:</span>
                  <span className="font-semibold text-slate-900">
                    {activePlotted.inspection.category === 'kinerja_prasarana'
                      ? 'Kinerja Prasarana Sungai'
                      : 'Kondisi Fisik Sungai'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wilayah Sungai:</span>
                  <span className="font-semibold text-[#0B2C5F]">
                    {activePlotted.inspection.namaWs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balai PSDA:</span>
                  <span className="font-semibold text-slate-800">
                    {activePlotted.inspection.balaiPsda}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Koordinat Awal:</span>
                  <span className="text-slate-800">
                    {activePlotted.inspection.koordinatAwal}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Koordinat Akhir:</span>
                  <span className="text-slate-800">
                    {activePlotted.inspection.koordinatAkhir}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="font-semibold text-slate-700">
                    Skor NKF / Kinerja:
                  </span>
                  <span
                    className={`font-mono text-lg font-extrabold tabular-nums ${
                      activePlotted.inspection.nkfTotal > 70
                        ? 'text-emerald-700'
                        : activePlotted.inspection.nkfTotal >= 50
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {activePlotted.inspection.nkfTotal.toFixed(2)}% (
                    {activePlotted.inspection.physicalStatusLabel})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-10 text-center">
              Pilih titik pada peta untuk melihat detail.
            </div>
          )}

          {activePlotted && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => onSelectInspection(activePlotted.inspection)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Buka Blangko Lengkap &amp; Dokumentasi
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeCenter.lat},${activeCenter.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#1B65A6]" />
                Buka Titik Ini di Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

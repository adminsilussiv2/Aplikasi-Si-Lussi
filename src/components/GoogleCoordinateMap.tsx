import React, { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { parseCoordString } from '../types/silussi';

interface GoogleCoordinateMapProps {
  koordinatAwal: string;
  koordinatAkhir: string;
  labelContext?: string;
}

export const GoogleCoordinateMap: React.FC<GoogleCoordinateMapProps> = ({
  koordinatAwal,
  koordinatAkhir,
  labelContext = 'Ruas Sungai / Prasarana',
}) => {
  const [focusTarget, setFocusTarget] = useState<'awal' | 'akhir'>('awal');
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
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

  const parsedAwal = useMemo(
    () =>
      parseCoordString(koordinatAwal) || {
        lat: -6.9214,
        lng: 109.4125,
      },
    [koordinatAwal]
  );

  const parsedAkhir = useMemo(
    () =>
      parseCoordString(koordinatAkhir) || {
        lat: parsedAwal.lat + 0.02,
        lng: parsedAwal.lng + 0.02,
      },
    [koordinatAkhir, parsedAwal]
  );

  const activeCoord = focusTarget === 'awal' ? parsedAwal : parsedAkhir;

  const embedUrl = useMemo(() => {
    const tParam = mapStyle === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${activeCoord.lat},${activeCoord.lng}&t=${tParam}&z=14&hl=id&output=embed`;
  }, [activeCoord.lat, activeCoord.lng, mapStyle]);

  const externalGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeCoord.lat},${activeCoord.lng}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1B65A6] shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#0B2C5F]">
              Preview Titik Koordinat Google Maps — {labelContext}
            </h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Fokus: {focusTarget === 'awal' ? 'Titik Awal' : 'Titik Akhir'} (
              {activeCoord.lat.toFixed(5)}, {activeCoord.lng.toFixed(5)})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Switch Focus: Koordinat Awal vs Akhir */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFocusTarget('awal')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                focusTarget === 'awal'
                  ? 'bg-[#0B2C5F] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Titik Awal ({parsedAwal.lat.toFixed(4)}, {parsedAwal.lng.toFixed(4)})
            </button>
            <button
              type="button"
              onClick={() => setFocusTarget('akhir')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                focusTarget === 'akhir'
                  ? 'bg-[#0B2C5F] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Titik Akhir ({parsedAkhir.lat.toFixed(4)}, {parsedAkhir.lng.toFixed(4)})
            </button>
          </div>

          {/* Toggle Roadmap / Satellite */}
          <button
            type="button"
            onClick={() =>
              setMapStyle((prev) =>
                prev === 'roadmap' ? 'satellite' : 'roadmap'
              )
            }
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-[#1B65A6]" />
            {mapStyle === 'roadmap' ? 'Mode Satelit' : 'Mode Peta Jalan'}
          </button>

          <a
            href={externalGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 text-[11px] font-semibold text-[#1B65A6] inline-flex items-center gap-1 whitespace-nowrap"
          >
            <ExternalLink className="w-3 h-3" />
            Google Maps
          </a>
        </div>
      </div>

      {/* Google Map Container (CF2: Explicit CSS Height) */}
      <div className="w-full h-64 relative bg-slate-200">
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
              center={activeCoord}
              defaultZoom={14}
              mapTypeId={mapStyle}
              gestureHandling="cooperative"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              <AdvancedMarker
                position={parsedAwal}
                title={`Titik Koordinat Awal: ${koordinatAwal}`}
              >
                <Pin
                  background="#0B2C5F"
                  borderColor="#ffffff"
                  glyphColor="#38BDF8"
                />
              </AdvancedMarker>
              <AdvancedMarker
                position={parsedAkhir}
                title={`Titik Koordinat Akhir: ${koordinatAkhir}`}
              >
                <Pin
                  background="#10B981"
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          <iframe
            key={`${activeCoord.lat}-${activeCoord.lng}-${mapStyle}`}
            title={`Google Maps Preview ${labelContext}`}
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* Bottom Coordinate Bar */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0B2C5F] inline-block" />
            Awal: <strong>{koordinatAwal || '-'}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            Akhir: <strong>{koordinatAkhir || '-'}</strong>
          </span>
        </div>
        <span className="flex items-center gap-1 text-slate-500">
          <Navigation className="w-3 h-3 text-[#1B65A6]" />
          Peta otomatis memperbarui lokasi sesuai titik koordinat yang diinput
        </span>
      </div>
    </div>
  );
};

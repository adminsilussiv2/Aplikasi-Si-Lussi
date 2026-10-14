/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  MapMouseEvent,
  Pin,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { parseCoordString } from '../types/silussi';

interface GoogleCoordinateMapProps {
  koordinatAwal: string;
  koordinatAkhir: string;
  onChangeKoordinatAwal?: (coord: string) => void;
  onChangeKoordinatAkhir?: (coord: string) => void;
  labelContext?: string;
}

export const GoogleCoordinateMap: React.FC<GoogleCoordinateMapProps> = ({
  koordinatAwal,
  koordinatAkhir,
  onChangeKoordinatAwal,
  onChangeKoordinatAkhir,
  labelContext = 'Ruas Sungai / Prasarana',
}) => {
  const [focusTarget, setFocusTarget] = useState<'awal' | 'akhir'>('awal');
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [sdkAuthFailed, setSdkAuthFailed] = useState(false);
  const [adjustmentNotice, setAdjustmentNotice] = useState<string | null>(null);

  const rawApiKey = (
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  ).trim();
  const isStandardGcpKey =
    rawApiKey.startsWith('AIza') && rawApiKey.length > 25;

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

  const triggerNotice = (msg: string) => {
    setAdjustmentNotice(msg);
    setTimeout(() => {
      setAdjustmentNotice(null);
    }, 3500);
  };

  const handleApplyCoordinate = (target: 'awal' | 'akhir', formatted: string) => {
    if (target === 'awal' && onChangeKoordinatAwal) {
      onChangeKoordinatAwal(formatted);
      triggerNotice(`Titik Awal disesuaikan ke: ${formatted}`);
    } else if (target === 'akhir' && onChangeKoordinatAkhir) {
      onChangeKoordinatAkhir(formatted);
      triggerNotice(`Titik Akhir disesuaikan ke: ${formatted}`);
    }
  };

  // Click on map to adjust the currently focused coordinate
  const handleMapClick = (e: MapMouseEvent) => {
    const latLng = e.detail.latLng;
    if (!latLng) return;
    const lat = typeof latLng.lat === 'function' ? (latLng.lat as () => number)() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? (latLng.lng as () => number)() : latLng.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      handleApplyCoordinate(focusTarget, formatted);
    }
  };

  const embedUrl = useMemo(() => {
    const tParam = mapStyle === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${activeCoord.lat},${activeCoord.lng}&t=${tParam}&z=15&hl=id&output=embed`;
  }, [activeCoord.lat, activeCoord.lng, mapStyle]);

  const isEditable = Boolean(onChangeKoordinatAwal || onChangeKoordinatAkhir);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs">
      {/* Top Bar - Clean & Minimal */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1B65A6] shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#0B2C5F]">
              Peta Lokasi {labelContext ? `— ${labelContext}` : ''}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isEditable ? 'Klik pada peta untuk menyesuaikan titik koordinat' : 'Lokasi koordinat pada peta'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Toggle: Titik Awal vs Titik Akhir */}
          {isEditable && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFocusTarget('awal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  focusTarget === 'awal'
                    ? 'bg-[#0B2C5F] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Titik Awal
              </button>
              <button
                type="button"
                onClick={() => setFocusTarget('akhir')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  focusTarget === 'akhir'
                    ? 'bg-[#0B2C5F] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Titik Akhir
              </button>
            </div>
          )}

          {/* Toggle Satellite / Roadmap */}
          <button
            type="button"
            onClick={() =>
              setMapStyle((prev) =>
                prev === 'roadmap' ? 'satellite' : 'roadmap'
              )
            }
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{mapStyle === 'roadmap' ? 'Satelit' : 'Peta'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast over Map */}
      {adjustmentNotice && (
        <div className="bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            {adjustmentNotice}
          </span>
          <button
            type="button"
            onClick={() => setAdjustmentNotice(null)}
            className="text-[11px] text-emerald-100 hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-72 relative bg-slate-200 cursor-crosshair">
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
              defaultZoom={15}
              mapTypeId={mapStyle}
              gestureHandling="cooperative"
              disableDefaultUI={false}
              onClick={handleMapClick}
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
                  scale={focusTarget === 'awal' ? 1.15 : 0.95}
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
                  scale={focusTarget === 'akhir' ? 1.15 : 0.95}
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

      {/* Clean Bottom Coordinate Bar */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B2C5F] inline-block" />
            <span>Awal: <strong className="text-slate-800">{koordinatAwal || '-'}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Akhir: <strong className="text-slate-800">{koordinatAkhir || '-'}</strong></span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
          Format: Lintang, Bujur
        </span>
      </div>
    </div>
  );
};

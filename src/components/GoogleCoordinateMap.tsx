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
  Navigation,
  ExternalLink,
  Layers,
  LocateFixed,
  Loader2,
  CheckCircle2,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { parseCoordString } from '../types/silussi';
import { getCurrentInspectorPosition } from '../utils/geolocation';

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
  const [gpsLoading, setGpsLoading] = useState(false);
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
    }, 4000);
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

  // GPS fetch from map header
  const handleGpsMapAdjust = async () => {
    try {
      setGpsLoading(true);
      const pos = await getCurrentInspectorPosition();
      handleApplyCoordinate(focusTarget, pos.formatted);
      triggerNotice(
        `Lokasi GPS (${pos.formatted}) berhasil dipasang pada ${
          focusTarget === 'awal' ? 'Titik Awal' : 'Titik Akhir'
        } (Akurasi: ±${pos.accuracy}m)`
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mendeteksi lokasi GPS perangkat.';
      alert(msg);
    } finally {
      setGpsLoading(false);
    }
  };

  // Fine-tuning nudge (0.0005 deg ~ 55 meter)
  const handleNudge = (dLat: number, dLng: number) => {
    const current = focusTarget === 'awal' ? parsedAwal : parsedAkhir;
    const nextLat = (current.lat + dLat).toFixed(6);
    const nextLng = (current.lng + dLng).toFixed(6);
    const formatted = `${nextLat}, ${nextLng}`;
    handleApplyCoordinate(focusTarget, formatted);
  };

  const embedUrl = useMemo(() => {
    const tParam = mapStyle === 'satellite' ? 'k' : 'm';
    return `https://maps.google.com/maps?q=${activeCoord.lat},${activeCoord.lng}&t=${tParam}&z=15&hl=id&output=embed`;
  }, [activeCoord.lat, activeCoord.lng, mapStyle]);

  const externalGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeCoord.lat},${activeCoord.lng}`;

  const isEditable = Boolean(onChangeKoordinatAwal || onChangeKoordinatAkhir);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1B65A6] shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#0B2C5F]">
                Peta Koordinat Lapangan — {labelContext}
              </h4>
              {isEditable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-[#1B65A6] border border-sky-200">
                  <Crosshair className="w-3 h-3" />
                  Mode Interaktif Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Fokus:{' '}
              <strong className="text-slate-800">
                {focusTarget === 'awal' ? 'Titik Awal' : 'Titik Akhir'}
              </strong>{' '}
              ({activeCoord.lat.toFixed(6)}, {activeCoord.lng.toFixed(6)})
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

          {/* Quick GPS button directly on map */}
          {isEditable && (
            <button
              type="button"
              onClick={handleGpsMapAdjust}
              disabled={gpsLoading}
              title="Ambil koordinat GPS saat ini dan pasang ke titik yang sedang difokuskan"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>
                {gpsLoading
                  ? 'Membaca GPS...'
                  : `Pasang GPS ke ${
                      focusTarget === 'awal' ? 'Titik Awal' : 'Titik Akhir'
                    }`}
              </span>
            </button>
          )}

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
            {mapStyle === 'roadmap' ? 'Satelit' : 'Peta Jalan'}
          </button>

          <a
            href={externalGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 text-[11px] font-semibold text-[#1B65A6] inline-flex items-center gap-1 whitespace-nowrap"
            title="Buka titik ini di Google Maps baru"
          >
            <ExternalLink className="w-3 h-3" />
            Buka Maps
          </a>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      {isEditable && (
        <div className="px-4 py-1.5 bg-sky-50/80 border-b border-sky-100 flex flex-wrap items-center justify-between text-[11px] text-[#0B2C5F]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Target aktif:{' '}
              <strong>
                {focusTarget === 'awal'
                  ? 'Titik Koordinat Awal'
                  : 'Titik Koordinat Akhir'}
              </strong>
              . Klik pada peta atau tombol GPS untuk menyesuaikan titik inspektor saat ini.
            </span>
          </div>

          {/* Fine Tuning Nudge Controls */}
          <div className="flex items-center gap-1 my-0.5">
            <span className="text-[10px] text-slate-500 mr-1 font-mono">
              Geser ~50m:
            </span>
            <button
              type="button"
              onClick={() => handleNudge(0.0005, 0)}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
              title="Geser ke Utara"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(-0.0005, 0)}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
              title="Geser ke Selatan"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, -0.0005)}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
              title="Geser ke Barat"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 0.0005)}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
              title="Geser ke Timur"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast over Map */}
      {adjustmentNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{adjustmentNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdjustmentNotice(null)}
            className="text-emerald-100 hover:text-white text-[11px] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Google Map Container (Explicit Height) */}
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
                  scale={focusTarget === 'awal' ? 1.2 : 1.0}
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
                  scale={focusTarget === 'akhir' ? 1.2 : 1.0}
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
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <button
            type="button"
            onClick={() => setFocusTarget('awal')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
              focusTarget === 'awal'
                ? 'bg-sky-50 text-[#0B2C5F] font-bold border border-sky-200'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B2C5F] inline-block" />
            <span>
              Awal: <strong>{koordinatAwal || '-'}</strong>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFocusTarget('akhir')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
              focusTarget === 'akhir'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>
              Akhir: <strong>{koordinatAkhir || '-'}</strong>
            </span>
          </button>
        </div>

        <span className="flex items-center gap-1 text-slate-500">
          <Navigation className="w-3.5 h-3.5 text-[#1B65A6]" />
          Peta otomatis sinkron &amp; memperbarui lokasi titik koordinat secara langsung
        </span>
      </div>
    </div>
  );
};

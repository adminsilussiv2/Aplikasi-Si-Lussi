/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InspectorPosition {
  lat: number;
  lng: number;
  accuracy: number;
  formatted: string;
  timestamp: string;
}

export interface BalaiGpsPreset {
  balaiName: string;
  ws: string;
  lat: number;
  lng: number;
  formatted: string;
  description: string;
}

export const BALAI_GPS_PRESETS: BalaiGpsPreset[] = [
  {
    balaiName: 'BPSDA Pemali Comal',
    ws: 'WS Pemali Comal',
    lat: -6.8705,
    lng: 109.0421,
    formatted: '-6.870500, 109.042100',
    description: 'Kab. Brebes & Tegal — Muara & Alur Sungai Pemali',
  },
  {
    balaiName: 'BPSDA Bodri Kuto',
    ws: 'WS Bodri Kuto',
    lat: -6.9124,
    lng: 110.1842,
    formatted: '-6.912400, 110.184200',
    description: 'Kab. Kendal & Batang — Alur Sungai Bodri Hilir',
  },
  {
    balaiName: 'BPSDA Jratun Seluna',
    ws: 'WS Jratunseluna',
    lat: -7.0418,
    lng: 110.6542,
    formatted: '-7.041800, 110.654200',
    description: 'Kota Semarang & Kab. Demak — Sungai Jragung & Tuntang',
  },
  {
    balaiName: 'BPSDA Bengawan Solo',
    ws: 'WS Bengawan Solo',
    lat: -7.5284,
    lng: 110.8251,
    formatted: '-7.528400, 110.825100',
    description: 'Surakarta & Sukoharjo — Alur Bengawan Solo Hulu',
  },
  {
    balaiName: 'BPSDA Progo Bogowonto Lukulo',
    ws: 'WS Probolo',
    lat: -7.6142,
    lng: 110.2784,
    formatted: '-7.614200, 110.278400',
    description: 'Kab. Magelang & Purworejo — Sungai Progo & Groundsill',
  },
  {
    balaiName: 'BPSDA Serayu Bogowonto',
    ws: 'WS Serayu Citanduy',
    lat: -7.4619,
    lng: 109.2484,
    formatted: '-7.461900, 109.248400',
    description: 'Banyumas & Cilacap — Bendung Gerak Serayu',
  },
];

/**
 * Mendapatkan posisi koordinat GPS terkini dari perangkat Inspektor lapangan.
 * Menggunakan mode akurasi tinggi (GPS hardware) dengan fallback cerdas.
 */
export function getCurrentInspectorPosition(): Promise<InspectorPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          'Browser / perangkat ini belum mendukung fitur pendeteksi lokasi GPS.'
        )
      );
      return;
    }

    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const fallbackOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10000,
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy || 10;
      const formatted = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const timestamp = new Date(pos.timestamp || Date.now()).toLocaleTimeString(
        'id-ID',
        {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }
      );

      resolve({
        lat,
        lng,
        accuracy: Math.round(accuracy * 10) / 10,
        formatted,
        timestamp,
      });
    };

    // Percobaan pertama: High Accuracy GPS (Satelit)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        // Jika hanya timeout pada GPS satelit, coba fallback ke jaringan seluler/Wi-Fi
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (fallbackErr) => {
              reject(mapGeolocationError(fallbackErr));
            },
            fallbackOptions
          );
        } else {
          reject(mapGeolocationError(error));
        }
      },
      highAccuracyOptions
    );
  });
}

function mapGeolocationError(err: GeolocationPositionError): Error {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new Error(
        'Izin akses lokasi GPS ditolak oleh browser/perangkat. Silakan izinkan akses lokasi (Location Permission) di pengaturan browser Anda.'
      );
    case err.POSITION_UNAVAILABLE:
      return new Error(
        'Sinyal GPS / informasi lokasi tidak tersedia pada perangkat saat ini.'
      );
    case err.TIMEOUT:
      return new Error(
        'Waktu pencarian sinyal GPS habis. Pastikan perangkat Anda berada di area terbuka dan GPS aktif.'
      );
    default:
      return new Error(
        err.message || 'Terjadi kendala saat membaca koordinat GPS perangkat.'
      );
  }
}

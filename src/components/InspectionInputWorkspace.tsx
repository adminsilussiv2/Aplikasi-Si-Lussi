import React, { useEffect, useState } from 'react';
import {
  Save,
  Camera,
  Sliders,
  AlertOctagon,
  UserCheck,
  Trash2,
  Image as ImageIcon,
  Waves,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  Loader2,
  RefreshCw,
  AlertCircle,
  Crosshair,
  Compass,
  MapPin,
} from 'lucide-react';
import {
  BALAI_PSDA_OPTIONS,
  BLANGKO_COMPONENTS,
  BalaiPSDA,
  ComponentDocumentation,
  InspectionCategory,
  NAMA_BANGUNAN_OPTIONS,
  NamaBangunanPrasarana,
  PRASARANA_COMPONENTS,
  RiverInspection,
  SubComponentValue,
  UserAccount,
  WILAYAH_SUNGAI_OPTIONS,
  WilayahSungai,
  calculateInspectionScores,
  getComponentsByCategory,
  getMatchingIfLabel,
} from '../types/silussi';
import { FIELD_SAMPLE_PHOTOS } from '../data/seedData';
import { GoogleCoordinateMap } from './GoogleCoordinateMap';
import {
  BALAI_GPS_PRESETS,
  getCurrentInspectorPosition,
  InspectorPosition,
} from '../utils/geolocation';

interface InspectionInputWorkspaceProps {
  currentUser: UserAccount;
  initialCategory: InspectionCategory;
  existingCount: number;
  onChangeCategory: (category: InspectionCategory) => void;
  onSaveInspection: (newInspection: RiverInspection) => void;
  onBackToDashboard: () => void;
}

function createInitialSubValues(): Record<string, SubComponentValue> {
  const initial: Record<string, SubComponentValue> = {};
  for (const comp of [...BLANGKO_COMPONENTS, ...PRASARANA_COMPONENTS]) {
    for (const sub of comp.subComponents) {
      initial[sub.id] = {
        subId: sub.id,
        nilaiFisik: 80,
        conditionLabel: sub.ifOptions[1].label,
        keterangan: '',
        docLink: '',
        photos: [],
      };
    }
  }
  return initial;
}

export const InspectionInputWorkspace: React.FC<
  InspectionInputWorkspaceProps
> = ({
  currentUser,
  initialCategory,
  existingCount,
  onChangeCategory,
  onSaveInspection,
  onBackToDashboard,
}) => {
  const [category, setCategory] = useState<InspectionCategory>(initialCategory);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // General River / Prasarana Metadata (No Luas DAS, No Panjang Sungai, No Jenis Prasarana Utama)
  const [namaSungai, setNamaSungai] = useState('');
  const [namaPrasarana, setNamaPrasarana] =
    useState<NamaBangunanPrasarana>('Bendung');
  const [noRuas, setNoRuas] = useState('');
  const [panjangRuasKm, setPanjangRuasKm] = useState<string>('4.2');
  const [namaWs, setNamaWs] = useState<WilayahSungai>('WS Pemali Comal');
  const [balaiPsda, setBalaiPsda] = useState<BalaiPSDA>(currentUser.balaiPsda);
  const [desa, setDesa] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('');
  const [koordinatAwal, setKoordinatAwal] = useState('-6.9214, 109.4125');
  const [koordinatAkhir, setKoordinatAkhir] = useState('-6.8950, 109.4310');
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [includeMuaraInSummary, setIncludeMuaraInSummary] = useState(false);

  // Inspector Field GPS Geolocation state
  const [gpsLoadingTarget, setGpsLoadingTarget] = useState<
    'awal' | 'akhir' | 'both' | 'detect' | null
  >(null);
  const [lastDetectedGps, setLastDetectedGps] =
    useState<InspectorPosition | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [gpsSuccessNotice, setGpsSuccessNotice] = useState<string | null>(null);
  const [showBalaiPresets, setShowBalaiPresets] = useState(false);

  const handleDetectGps = async (
    target: 'awal' | 'akhir' | 'both' | 'detect'
  ) => {
    try {
      setGpsLoadingTarget(target);
      setGpsErrorMsg(null);
      const pos = await getCurrentInspectorPosition();
      setLastDetectedGps(pos);

      if (target === 'awal') {
        setKoordinatAwal(pos.formatted);
        setGpsSuccessNotice(
          `Titik Koordinat Awal disesuaikan ke posisi GPS Anda (${pos.formatted}) · Akurasi: ±${pos.accuracy}m`
        );
      } else if (target === 'akhir') {
        setKoordinatAkhir(pos.formatted);
        setGpsSuccessNotice(
          `Titik Koordinat Akhir disesuaikan ke posisi GPS Anda (${pos.formatted}) · Akurasi: ±${pos.accuracy}m`
        );
      } else if (target === 'both') {
        setKoordinatAwal(pos.formatted);
        setKoordinatAkhir(pos.formatted);
        setGpsSuccessNotice(
          `Titik Awal & Akhir disesuaikan ke posisi GPS Anda (${pos.formatted}) · Akurasi: ±${pos.accuracy}m`
        );
      } else {
        setGpsSuccessNotice(
          `Titik GPS berhasil terdeteksi: ${pos.formatted} (Akurasi: ±${pos.accuracy}m). Silakan pilih pasang ke Titik Awal atau Akhir.`
        );
      }

      setTimeout(() => setGpsSuccessNotice(null), 5000);
    } catch (err) {
      setGpsErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal mendeteksi koordinat GPS perangkat.'
      );
    } finally {
      setGpsLoadingTarget(null);
    }
  };

  const handleApplyBalaiPreset = (
    presetFormatted: string,
    balaiName: string,
    target: 'awal' | 'akhir' | 'both' = 'awal'
  ) => {
    if (target === 'awal') {
      setKoordinatAwal(presetFormatted);
      setGpsSuccessNotice(
        `Titik Awal disesuaikan ke referensi ${balaiName}: ${presetFormatted}`
      );
    } else if (target === 'akhir') {
      setKoordinatAkhir(presetFormatted);
      setGpsSuccessNotice(
        `Titik Akhir disesuaikan ke referensi ${balaiName}: ${presetFormatted}`
      );
    } else {
      setKoordinatAwal(presetFormatted);
      setKoordinatAkhir(presetFormatted);
      setGpsSuccessNotice(
        `Titik Awal & Akhir disesuaikan ke referensi ${balaiName}: ${presetFormatted}`
      );
    }
    setTimeout(() => setGpsSuccessNotice(null), 4000);
  };

  const [subValues, setSubValues] = useState<Record<string, SubComponentValue>>(
    createInitialSubValues
  );
  // Track which sub-components have their optional documentation drawer open
  const [openDocSubIds, setOpenDocSubIds] = useState<Record<string, boolean>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);

  const activeComponents = getComponentsByCategory(category);
  const calc = calculateInspectionScores(subValues, category);

  const handleCategorySwitch = (newCat: InspectionCategory) => {
    setCategory(newCat);
    onChangeCategory(newCat);
    setFormError(null);
  };

  const toggleSubDocDrawer = (subId: string) => {
    setOpenDocSubIds((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const handleIfOptionChange = (
    subId: string,
    selectedScore: number,
    label: string
  ) => {
    setSubValues((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        subId,
        nilaiFisik: selectedScore,
        conditionLabel: label,
      },
    }));
  };

  const handleSliderChange = (subId: string, rawValue: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(rawValue)));
    const comp = activeComponents.find((c) =>
      c.subComponents.some((s) => s.id === subId)
    );
    const subMeta = comp?.subComponents.find((s) => s.id === subId);
    const matchedLabel = subMeta ? getMatchingIfLabel(subMeta, clamped) : '';

    setSubValues((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        subId,
        nilaiFisik: clamped,
        conditionLabel: matchedLabel,
      },
    }));
  };

  const handleSubDocFieldChange = (
    subId: string,
    field: 'keterangan' | 'docLink',
    value: string
  ) => {
    setSubValues((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value,
      },
    }));
  };

  const handleSubFileUpload = (
    subId: string,
    subName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;

        setSubValues((prev) => {
          const existing = prev[subId];
          const customNote = existing?.keterangan?.trim();
          return {
            ...prev,
            [subId]: {
              ...existing,
              photos: [
                ...(existing?.photos || []),
                {
                  id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  url: dataUrl,
                  caption: customNote
                    ? customNote
                    : `Dokumentasi ${subName} (${file.name})`,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            },
          };
        });
      };
      reader.readAsDataURL(file);
    });

    setOpenDocSubIds((prev) => ({ ...prev, [subId]: true }));
    e.target.value = '';
  };

  const handleSubPhotoCaptionChange = (
    subId: string,
    photoId: string,
    newCaption: string
  ) => {
    setSubValues((prev) => {
      const existing = prev[subId];
      return {
        ...prev,
        [subId]: {
          ...existing,
          photos: (existing?.photos || []).map((p) =>
            p.id === photoId ? { ...p, caption: newCaption } : p
          ),
        },
      };
    });
  };

  const handleRemoveSubPhoto = (subId: string, photoId: string) => {
    setSubValues((prev) => {
      const existing = prev[subId];
      return {
        ...prev,
        [subId]: {
          ...existing,
          photos: (existing?.photos || []).filter((p) => p.id !== photoId),
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !namaSungai.trim() ||
      !noRuas.trim() ||
      !desa.trim() ||
      !kecamatan.trim() ||
      !kabupatenKota.trim()
    ) {
      setFormError(
        'Mohon lengkapi Nama Sungai, Nomor/Keterangan Ruas, Desa, Kecamatan, dan Kabupaten/Kota terlebih dahulu.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const nextNumber = String(existingCount + 1).padStart(3, '0');
    const prefix = category === 'kinerja_prasarana' ? 'SL2-PRS' : 'SL2-FSK';
    const kodeInspeksi = `${prefix}-${nextNumber}`;

    // Aggregate optional sub-component documentation into componentDocs for reports & exports
    const aggregatedDocs: Record<string, ComponentDocumentation> = {};
    for (const comp of activeComponents) {
      const notesList: string[] = [];
      let firstLink = '';
      const allPhotos = [];

      for (const sub of comp.subComponents) {
        const sv = subValues[sub.id];
        if (sv?.keterangan?.trim()) {
          notesList.push(`${sub.name}: ${sv.keterangan.trim()}`);
        }
        if (!firstLink && sv?.docLink?.trim()) {
          firstLink = sv.docLink.trim();
        }
        if (sv?.photos && sv.photos.length > 0) {
          allPhotos.push(...sv.photos);
        }
      }

      aggregatedDocs[comp.key] = {
        componentKey: comp.key,
        keterangan: notesList.join(' | '),
        docLink: firstLink,
        photos: allPhotos,
      };
    }

    const followUpStatus =
      calc.nkfTotal <= 70 ? 'Perlu Tindak Lanjut' : 'Aman / Terkendali';

    const defaultFollowUpNotes =
      calc.nkfTotal < 50
        ? `Temuan Risiko Tinggi (Skor ${calc.nkfTotal.toFixed(2)}% - RUSAK BERAT). Membutuhkan penanganan rehabilitatif segera.`
        : calc.nkfTotal <= 70
        ? `Temuan Risiko Sedang (Skor ${calc.nkfTotal.toFixed(2)}% - Kinerja Cukup). Membutuhkan pemeliharaan korektif.`
        : `Kondisi baik (Skor ${calc.nkfTotal.toFixed(2)}%). Pemeliharaan preventif rutin.`;

    const newInspection: RiverInspection = {
      id: `insp-${Date.now()}`,
      category,
      kodeInspeksi,
      namaSungai: namaSungai.trim(),
      namaPrasarana:
        category === 'kinerja_prasarana' ? namaPrasarana : undefined,
      noRuas: noRuas.trim(),
      panjangRuasKm: parseFloat(panjangRuasKm) || 0,
      namaWs,
      desa: desa.trim(),
      kecamatan: kecamatan.trim(),
      kabupatenKota: kabupatenKota.trim(),
      balaiPsda,
      koordinatAwal: koordinatAwal.trim(),
      koordinatAkhir: koordinatAkhir.trim(),
      tanggalPelaksanaan,
      createdAt: new Date().toISOString(),
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorNip: currentUser.nip,
      inspectorBalai: currentUser.balaiPsda,
      subValues,
      componentDocs: aggregatedDocs,
      linkDokumentasi1:
        aggregatedDocs[activeComponents[0].key]?.docLink ||
        `https://drive.pupr.jatengprov.go.id/silussi/${kodeInspeksi.toLowerCase()}/doc-1`,
      linkDokumentasi2:
        aggregatedDocs[activeComponents[1]?.key]?.docLink ||
        `https://drive.pupr.jatengprov.go.id/silussi/${kodeInspeksi.toLowerCase()}/doc-2`,
      linkDokumentasi3:
        aggregatedDocs[activeComponents[2]?.key]?.docLink ||
        `https://drive.pupr.jatengprov.go.id/silussi/${kodeInspeksi.toLowerCase()}/doc-3`,
      nkfTotal: calc.nkfTotal,
      muaraScore: calc.muaraScore,
      includeMuaraInSummary,
      riskLevel: calc.riskLevel,
      performanceLevel: calc.performanceLevel,
      maintenanceAction: calc.maintenanceAction,
      physicalStatusLabel: calc.physicalStatusLabel,
      followUpStatus,
      followUpNotes: defaultFollowUpNotes,
    };

    onSaveInspection(newInspection);
  };

  return (
    <div className="space-y-6">
      {/* Top Workspace Header & 2 Inspection Category Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#1B65A6]">
              Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#0B2C5F] mt-0.5">
              Formulir Input Blangko Inspeksi Lapangan
            </h1>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="self-start lg:self-auto px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#0B2C5F] text-xs font-semibold text-slate-700 hover:text-[#0B2C5F] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard Analitik
          </button>
        </div>

        {/* 2 Inspection Type Selector Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleCategorySwitch('fisik_sungai')}
            className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              category === 'fisik_sungai'
                ? 'bg-[#0B2C5F] text-white border-[#0B2C5F] shadow-xs'
                : 'bg-slate-50 hover:bg-sky-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                category === 'fisik_sungai'
                  ? 'bg-white/15 text-sky-300'
                  : 'bg-[#0B2C5F]/10 text-[#0B2C5F]'
              }`}
            >
              <Waves className="w-5 h-5" />
            </div>
            <div className="font-display text-sm font-bold">
              1. Input Kondisi Fisik Sungai (Per Ruas)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySwitch('kinerja_prasarana')}
            className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
              category === 'kinerja_prasarana'
                ? 'bg-[#0B2C5F] text-white border-[#0B2C5F] shadow-xs'
                : 'bg-slate-50 hover:bg-sky-50/50 text-slate-800 border-slate-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                category === 'kinerja_prasarana'
                  ? 'bg-white/15 text-sky-300'
                  : 'bg-[#0B2C5F]/10 text-[#0B2C5F]'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="font-display text-sm font-bold">
              2. Input Kinerja Prasarana Sungai
            </div>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Automatic Inspector Identity Card */}
          <div className="p-4 rounded-xl bg-sky-50/90 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B2C5F] text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1B65A6]">
                  Identitas Inspektor Pelapor (Otomatis dari Akun Login)
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  NIP: {currentUser.nip} · Unit: {currentUser.balaiPsda}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              Otomatis tercatat tanpa perlu diketik ulang
            </div>
          </div>

          {/* Section 1: Data Umum & Preview Titik Koordinat dengan Peta (Tanpa Panjang Sungai & Tanpa Jenis Prasarana Utama) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <h2 className="font-display text-sm font-bold text-[#0B2C5F] pb-2.5 border-b border-slate-100 uppercase">
              {category === 'kinerja_prasarana'
                ? 'A. Identitas Bangunan Prasarana & Lokasi Ruas Sungai'
                : 'A. Identitas Ruas Sungai (PENILAIAN KONDISI FISIK SUNGAI PER RUAS)'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sungai <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaSungai}
                  onChange={(e) => setNamaSungai(e.target.value)}
                  placeholder="Contoh: Sungai Pemali / Sungai Serayu"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Ruas / Keterangan Ruas <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={noRuas}
                  onChange={(e) => setNoRuas(e.target.value)}
                  placeholder="Contoh: Ruas Pml-04 (Jembatan Brebes - Hilir)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              {/* Nama Bangunan Dropdown (18 Official Options) only on Kinerja Prasarana */}
              {category === 'kinerja_prasarana' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Bangunan <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={namaPrasarana}
                    onChange={(e) =>
                      setNamaPrasarana(
                        e.target.value as NamaBangunanPrasarana
                      )
                    }
                    className="w-full px-3 py-2 text-sm font-semibold text-[#0B2C5F] rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                  >
                    {NAMA_BANGUNAN_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Wilayah Sungai (WS) <span className="text-red-600">*</span>
                </label>
                <select
                  value={namaWs}
                  onChange={(e) => setNamaWs(e.target.value as WilayahSungai)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                >
                  {WILAYAH_SUNGAI_OPTIONS.map((ws) => (
                    <option key={ws} value={ws}>
                      {ws}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Balai PSDA <span className="text-red-600">*</span>
                </label>
                <select
                  value={balaiPsda}
                  onChange={(e) => setBalaiPsda(e.target.value as BalaiPSDA)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                >
                  {BALAI_PSDA_OPTIONS.map((bpsda) => (
                    <option key={bpsda} value={bpsda}>
                      {bpsda}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panjang Ruas (Km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={panjangRuasKm}
                  onChange={(e) => setPanjangRuasKm(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tgl Pelaksanaan
                </label>
                <input
                  type="date"
                  value={tanggalPelaksanaan}
                  onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desa <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={desa}
                  onChange={(e) => setDesa(e.target.value)}
                  placeholder="Nama Desa"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kecamatan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    placeholder="Kecamatan"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kabupaten / Kota <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kabupatenKota}
                    onChange={(e) => setKabupatenKota(e.target.value)}
                    placeholder="Kabupaten / Kota"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                  />
                </div>
              </div>

              {/* Inspector GPS Sync Panel */}
              <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50/30 border border-sky-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-150">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0B2C5F] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <LocateFixed className="w-4 h-4 text-sky-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#0B2C5F]">
                          Penyesuaian Titik Koordinat GPS Inspektor (Real-Time)
                        </h4>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          GPS Aktif
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Klik tombol di bawah untuk mengambil titik koordinat posisi Anda saat berada di lokasi inspeksi sungai atau bangunan prasarana.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDetectGps('detect')}
                      disabled={gpsLoadingTarget !== null}
                      className="px-3 py-1.5 rounded-lg bg-[#0B2C5F] hover:bg-[#1B65A6] disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      {gpsLoadingTarget === 'detect' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LocateFixed className="w-3.5 h-3.5 text-sky-300" />
                      )}
                      <span>
                        {gpsLoadingTarget === 'detect'
                          ? 'Membaca Sensor GPS...'
                          : 'Ambil Titik Koordinat Saya (GPS)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowBalaiPresets((prev) => !prev)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Lihat titik referensi kantor / posko Balai PSDA se-Jawa Tengah"
                    >
                      <MapPin className="w-3 h-3 text-[#1B65A6]" />
                      <span>{showBalaiPresets ? 'Tutup Referensi' : 'Titik Balai'}</span>
                    </button>
                  </div>
                </div>

                {/* GPS Success Banner */}
                {gpsSuccessNotice && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{gpsSuccessNotice}</span>
                  </div>
                )}

                {/* GPS Error Banner */}
                {gpsErrorMsg && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold">{gpsErrorMsg}</div>
                      <div className="text-[11px] text-amber-800/80 mt-1">
                        Tips: Pastikan izin lokasi aktif pada browser, atau Anda dapat menggunakan tombol <strong>Titik Balai</strong> atau klik langsung pada peta di bawah.
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Detected Position Bar with Quick Set Buttons */}
                {lastDetectedGps && (
                  <div className="mt-3 pt-3 border-t border-sky-150 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Hasil GPS Terkini:
                      </span>
                      <span className="font-mono text-xs font-bold text-[#0B2C5F] bg-white px-2 py-0.5 rounded border border-slate-200">
                        {lastDetectedGps.formatted}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Akurasi ±{lastDetectedGps.accuracy}m
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        pk. {lastDetectedGps.timestamp} WIB
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setKoordinatAwal(lastDetectedGps.formatted);
                          setGpsSuccessNotice(
                            `Titik Koordinat Awal disesuaikan ke ${lastDetectedGps.formatted}`
                          );
                          setTimeout(() => setGpsSuccessNotice(null), 4000);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Pasang ke Titik Awal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKoordinatAkhir(lastDetectedGps.formatted);
                          setGpsSuccessNotice(
                            `Titik Koordinat Akhir disesuaikan ke ${lastDetectedGps.formatted}`
                          );
                          setTimeout(() => setGpsSuccessNotice(null), 4000);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Pasang ke Titik Akhir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKoordinatAwal(lastDetectedGps.formatted);
                          setKoordinatAkhir(lastDetectedGps.formatted);
                          setGpsSuccessNotice(
                            `Titik Awal & Akhir disesuaikan ke ${lastDetectedGps.formatted}`
                          );
                          setTimeout(() => setGpsSuccessNotice(null), 4000);
                        }}
                        className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        title="Cocok untuk penilaian bangunan prasarana sungai (lokasi inspeksi tunggal)"
                      >
                        Pasang ke Keduanya
                      </button>
                    </div>
                  </div>
                )}

                {/* Central Java Balai PSDA Quick Reference Presets */}
                {showBalaiPresets && (
                  <div className="mt-3 pt-3 border-t border-sky-150">
                    <div className="text-[11px] font-semibold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Titik Referensi Wilayah Balai PSDA Provinsi Jawa Tengah:</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Klik untuk memasang koordinat referensi
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {BALAI_GPS_PRESETS.map((preset) => (
                        <div
                          key={preset.balaiName}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-left space-y-1"
                        >
                          <div className="text-[11px] font-bold text-[#0B2C5F] truncate">
                            {preset.balaiName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {preset.formatted}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {preset.description}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyBalaiPreset(
                                  preset.formatted,
                                  preset.balaiName,
                                  'awal'
                                )
                              }
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-[#1B65A6] hover:bg-sky-100 cursor-pointer"
                            >
                              Set Awal
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyBalaiPreset(
                                  preset.formatted,
                                  preset.balaiName,
                                  'akhir'
                                )
                              }
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                            >
                              Set Akhir
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyBalaiPreset(
                                  preset.formatted,
                                  preset.balaiName,
                                  'both'
                                )
                              }
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            >
                              Keduanya
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Titik Koordinat Awal Field with Direct Quick GPS Button */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Titik Koordinat Awal (X, Y)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDetectGps('awal')}
                    disabled={gpsLoadingTarget !== null}
                    className="text-[11px] font-semibold text-[#1B65A6] hover:text-[#0B2C5F] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Klik untuk mengambil koordinat GPS perangkat Anda saat ini dan pasang sebagai Titik Awal"
                  >
                    {gpsLoadingTarget === 'awal' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#1B65A6]" />
                    ) : (
                      <LocateFixed className="w-3 h-3 text-[#1B65A6]" />
                    )}
                    <span>
                      {gpsLoadingTarget === 'awal'
                        ? 'Membaca GPS...'
                        : 'Sesuaikan Titik Saya Saat Ini'}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  value={koordinatAwal}
                  onChange={(e) => setKoordinatAwal(e.target.value)}
                  placeholder="-6.870500, 109.042100"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
                <span className="block text-[10px] text-slate-500 font-mono mt-1">
                  Format: Lintang, Bujur (contoh: -6.921400, 109.412500)
                </span>
              </div>

              {/* Titik Koordinat Akhir Field with Direct Quick GPS Button */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Titik Koordinat Akhir (X, Y)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDetectGps('akhir')}
                    disabled={gpsLoadingTarget !== null}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Klik untuk mengambil koordinat GPS perangkat Anda saat ini dan pasang sebagai Titik Akhir"
                  >
                    {gpsLoadingTarget === 'akhir' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                    ) : (
                      <LocateFixed className="w-3 h-3 text-emerald-700" />
                    )}
                    <span>
                      {gpsLoadingTarget === 'akhir'
                        ? 'Membaca GPS...'
                        : 'Sesuaikan Titik Saya Saat Ini'}
                    </span>
                  </button>
                </div>
                <input
                  type="text"
                  value={koordinatAkhir}
                  onChange={(e) => setKoordinatAkhir(e.target.value)}
                  placeholder="-6.841200, 109.051800"
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:border-[#1B65A6] outline-none"
                />
                <span className="block text-[10px] text-slate-500 font-mono mt-1">
                  Format: Lintang, Bujur (dapat sama jika inspeksi bangunan tunggal)
                </span>
              </div>
            </div>

            {/* Live Interactive Coordinate Map with direct point clicking and GPS synchronization */}
            <GoogleCoordinateMap
              koordinatAwal={koordinatAwal}
              koordinatAkhir={koordinatAkhir}
              onChangeKoordinatAwal={setKoordinatAwal}
              onChangeKoordinatAkhir={setKoordinatAkhir}
              labelContext={
                category === 'kinerja_prasarana'
                  ? `${namaPrasarana}${namaSungai ? ` — ${namaSungai}` : ''}`
                  : namaSungai || 'Kondisi Fisik Sungai'
              }
            />
          </div>

          {/* Section 2: Penilaian Komponen / Kinerja Prasarana (Each sub-component has optional Klik Dokumentasi, NO Space Upload Dokumentasi block) */}
          <div className="space-y-6">
            {activeComponents.map((comp) => {
              const compCalc = calc.componentResults[comp.key];

              return (
                <div
                  key={comp.key}
                  id={`section-comp-${comp.key}`}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
                >
                  {/* Component Spreadsheet Header */}
                  <div className="bg-[#0B2C5F] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-bold">
                        {category === 'kinerja_prasarana'
                          ? `B. Input Nilai Kinerja Prasarana (${namaPrasarana})`
                          : `${comp.no}. ${comp.title}`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs bg-white/10 px-3.5 py-1.5 rounded-lg">
                      <span className="text-sky-200">
                        {category === 'kinerja_prasarana'
                          ? 'Nilai Kinerja: '
                          : 'Nilai Komponen: '}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {compCalc.nilaiFisikKomponen.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Sub-Components Rows */}
                  <div className="p-5 space-y-4">
                    {comp.subComponents.map((sub) => {
                      const currentVal = subValues[sub.id] || {
                        subId: sub.id,
                        nilaiFisik: 80,
                        conditionLabel: sub.ifOptions[1].label,
                        keterangan: '',
                        docLink: '',
                        photos: [],
                      };

                      const scoreColor =
                        currentVal.nilaiFisik > 70
                          ? 'text-emerald-700'
                          : currentVal.nilaiFisik >= 50
                          ? 'text-amber-700'
                          : 'text-red-700';

                      const subPhotos = currentVal.photos || [];

                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                        >
                          {/* Top Row: Sub-Component Title + Score */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {category === 'kinerja_prasarana'
                                  ? sub.name
                                  : `${sub.no}. ${sub.name}`}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              <div className="flex items-center gap-2 font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-slate-500">
                                  {category === 'kinerja_prasarana'
                                    ? 'Nilai Kinerja: '
                                    : 'Nilai Fisik: '}
                                </span>
                                <span
                                  className={`font-bold text-sm tabular-nums ${scoreColor}`}
                                >
                                  {currentVal.nilaiFisik}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Criteria Dropdown */}
                          <div>
                            <select
                              value={
                                sub.ifOptions.find(
                                  (o) => o.label === currentVal.conditionLabel
                                )?.score ?? ''
                              }
                              onChange={(e) => {
                                const sc = Number(e.target.value);
                                const found = sub.ifOptions.find(
                                  (o) => o.score === sc
                                );
                                if (found) {
                                  handleIfOptionChange(
                                    sub.id,
                                    found.score,
                                    found.label
                                  );
                                }
                              }}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                            >
                              {sub.ifOptions.map((opt) => (
                                <option key={opt.score} value={opt.score}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Angka Tarik (Slider) */}
                          <div className="pt-2 border-t border-slate-200/80">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-semibold text-[#0B2C5F] flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-[#1B65A6]" />
                                Angka Tarik Penyesuaian Lapangan (0% – 100%)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {currentVal.conditionLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={currentVal.nilaiFisik}
                                  onChange={(e) =>
                                    handleSliderChange(
                                      sub.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  style={{
                                    background: `linear-gradient(to right, #1B65A6 0%, #1B65A6 ${currentVal.nilaiFisik}%, #E2E8F0 ${currentVal.nilaiFisik}%, #E2E8F0 100%)`,
                                  }}
                                  className="w-full silussi-slider"
                                />
                              </div>

                              <div className="w-24 shrink-0 relative">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={currentVal.nilaiFisik}
                                  onChange={(e) =>
                                    handleSliderChange(
                                      sub.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-right pr-6 rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none tabular-nums"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Upload Dokumentasi Di Atas Keterangan Dokumentasi */}
                          <div className="pt-2.5 border-t border-slate-200/80 space-y-2.5">
                            <div>
                              <label className="px-3 py-1.5 rounded-lg bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap">
                                <Camera className="w-3.5 h-3.5" />
                                <span>
                                  Upload Foto
                                  {subPhotos.length > 0
                                    ? ` (${subPhotos.length})`
                                    : ''}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) =>
                                    handleSubFileUpload(
                                      sub.id,
                                      sub.name,
                                      e
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {subPhotos.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {subPhotos.map((ph) => (
                                  <div
                                    key={ph.id}
                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200"
                                  >
                                    <img
                                      src={ph.url}
                                      alt={ph.caption}
                                      referrerPolicy="no-referrer"
                                      className="w-16 h-12 object-cover rounded-md shrink-0 border border-slate-200"
                                    />
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <input
                                        type="text"
                                        value={ph.caption}
                                        onChange={(e) =>
                                          handleSubPhotoCaptionChange(
                                            sub.id,
                                            ph.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Keterangan foto..."
                                        className="w-full px-2 py-1 text-[11px] font-medium text-slate-800 rounded border border-slate-200 focus:border-[#1B65A6] outline-none"
                                      />
                                      <p className="text-[10px] font-mono text-emerald-700 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Foto Terlampir
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveSubPhoto(sub.id, ph.id)
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                      title="Hapus Foto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Keterangan Dokumentasi
                              </label>
                              <input
                                type="text"
                                value={currentVal.keterangan || ''}
                                onChange={(e) =>
                                  handleSubDocFieldChange(
                                    sub.id,
                                    'keterangan',
                                    e.target.value
                                  )
                                }
                                placeholder={`Masukkan keterangan dokumentasi untuk ${sub.name}...`}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Sticky Blangko Summary Table & Submit */}
        <div className="lg:col-span-4 sticky top-20 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#1B65A6]">
                Tabel Rekapitulasi Blangko Live
              </div>
              <h3 className="font-display text-base font-bold text-[#0B2C5F]">
                {category === 'kinerja_prasarana'
                  ? 'Ringkasan Kinerja Prasarana Sungai'
                  : 'Ringkasan Nilai Kondisi Fisik (NKF)'}
              </h3>
            </div>

            {/* Total Score Highlight */}
            <div
              className={`p-4 rounded-xl border ${
                calc.nkfTotal > 70
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  : calc.nkfTotal >= 50
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-red-50/90 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {category === 'kinerja_prasarana'
                    ? 'Nilai Kinerja Prasarana'
                    : 'Total NKF Sungai'}
                </span>
                <span className="font-mono text-3xl font-extrabold tabular-nums">
                  {calc.nkfTotal.toFixed(2)}%
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-black/10 space-y-1 text-xs">
                {category === 'kinerja_prasarana' && (
                  <div className="flex justify-between">
                    <span className="opacity-75">Nama Bangunan:</span>
                    <span className="font-bold">{namaPrasarana}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="opacity-75">Status:</span>
                  <span className="font-bold">{calc.physicalStatusLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Tingkat Risiko:</span>
                  <span className="font-semibold">{calc.riskLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Kinerja:</span>
                  <span className="font-semibold">{calc.performanceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Rekomendasi:</span>
                  <span className="font-bold underline">
                    {calc.maintenanceAction}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Summary Spreadsheet Table */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">
                {category === 'kinerja_prasarana'
                  ? 'Rekapitulasi Nilai Kinerja Prasarana'
                  : 'Rekapitulasi Komponen Penilaian'}
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="py-2 px-2.5 text-left font-semibold">
                        {category === 'kinerja_prasarana'
                          ? 'Parameter'
                          : 'Komponen'}
                      </th>
                      <th className="py-2 px-2.5 text-right font-mono font-semibold">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeComponents
                      .filter((c) => c.isMainWeighted)
                      .map((comp) => {
                        const res = calc.componentResults[comp.key];
                        const docCount = comp.subComponents.reduce(
                          (acc, s) =>
                            acc + (subValues[s.id]?.photos?.length || 0),
                          0
                        );
                        return (
                          <tr key={comp.key} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-slate-800">
                              <div className="font-medium">
                                {category === 'kinerja_prasarana'
                                  ? `${comp.shortTitle} (${namaPrasarana})`
                                  : `${comp.no}. ${comp.shortTitle}`}
                              </div>
                              <div className="text-[10px] text-[#1B65A6] font-mono">
                                {docCount} foto terlampir
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums text-[#0B2C5F]">
                              {res.nilaiFisikKomponen.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                      <td className="py-2 px-2.5">TOTAL NKF</td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-[#0B2C5F]">
                        {calc.nkfTotal.toFixed(2)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-700 mb-1">
                Kriteria Penilaian Blangko:
              </div>
              <div>
                1.{' '}
                <span className="font-mono font-semibold text-emerald-700">
                  &gt;70
                </span>{' '}
                = Risiko Rendah (RR) = Kinerja Baik = Pemeliharaan Preventif
              </div>
              <div>
                2.{' '}
                <span className="font-mono font-semibold text-amber-700">
                  50–70
                </span>{' '}
                = Risiko Sedang (RS) = Kinerja Cukup = Pemeliharaan Korektif
              </div>
              <div>
                3.{' '}
                <span className="font-mono font-semibold text-red-700">
                  &lt;50
                </span>{' '}
                = Risiko Tinggi (RT) = Kinerja Buruk = Rehabilitatif
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#0B2C5F] hover:bg-[#1B65A6] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Data Inspeksi &amp; Tampilkan di Peta
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

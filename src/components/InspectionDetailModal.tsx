import React, { useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  FollowUpStatus,
  RiverInspection,
  UserAccount,
  calculateInspectionScores,
  getComponentsByCategory,
} from '../types/silussi';
import {
  exportInspectionToCsv,
  exportInspectionToExcelHtml,
} from '../utils/reportExporter';
import { SiLussiLogo } from './SiLussiLogo';

interface InspectionDetailModalProps {
  inspection: RiverInspection;
  currentUser: UserAccount;
  onClose: () => void;
  onUpdateFollowUp: (
    inspectionId: string,
    newStatus: FollowUpStatus,
    notes: string
  ) => void;
  onDeleteInspection?: (inspectionId: string) => void;
  onLogExport: (format: string, inspection: RiverInspection) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  currentUser,
  onClose,
  onUpdateFollowUp,
  onDeleteInspection,
  onLogExport,
}) => {
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>(
    inspection.followUpStatus
  );
  const [followUpNotes, setFollowUpNotes] = useState(
    inspection.followUpNotes || ''
  );
  const [saveFeedback, setSaveFeedback] = useState(false);

  const category = inspection.category || 'fisik_sungai';
  const targetComponents = getComponentsByCategory(category);
  const calc = calculateInspectionScores(inspection.subValues, category);

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFollowUp(inspection.id, followUpStatus, followUpNotes);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handlePrintPdf = () => {
    onLogExport('PDF Blangko Resmi', inspection);
    window.print();
  };

  const handleDownloadExcel = () => {
    onLogExport('Spreadsheet Excel (.xls)', inspection);
    exportInspectionToExcelHtml(inspection);
  };

  const handleDownloadCsv = () => {
    onLogExport('Spreadsheet CSV (.csv)', inspection);
    exportInspectionToCsv(inspection);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Action Toolbar (Hidden in Print) */}
        <div className="no-print bg-[#0B2C5F] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-sky-300">
              {category === 'kinerja_prasarana'
                ? 'Blangko Penilaian Kinerja Prasarana Sungai'
                : 'Blangko Penilaian Kondisi Fisik Sungai (Per Ruas)'}{' '}
              · {inspection.kodeInspeksi}
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold">
              {inspection.namaSungai} — {inspection.noRuas}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-2 rounded-lg bg-white text-[#0B2C5F] hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Unduh PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-lg bg-[#1B65A6] hover:bg-[#2577c0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Excel (.xls)
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>

            {currentUser.role === 'admin' && onDeleteInspection && (
              <button
                type="button"
                onClick={() => onDeleteInspection(inspection.id)}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Hapus Data Inspeksi (Administrator)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Data
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-sky-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Official Blangko Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
          {/* Official Letterhead / Kop Dinas PU & Penataan Ruang Prov. Jawa Tengah */}
          <div className="border-b-2 border-[#0B2C5F] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <SiLussiLogo size="md" showText={true} />
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#1B65A6]">
                  Pemerintah Provinsi Jawa Tengah
                </div>
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-[#0B2C5F] tracking-tight">
                  DINAS PEKERJAAN UMUM DAN PENATAAN RUANG PROVINSI JAWA TENGAH
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {category === 'kinerja_prasarana'
                    ? 'PENILAIAN KINERJA PRASARANA SUNGAI — SI-LUSSI v2'
                    : 'PENILAIAN KONDISI FISIK SUNGAI ( PER RUAS ) — SI-LUSSI v2'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-0.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-slate-500">Kode Dokumen:</div>
              <div className="font-bold text-[#0B2C5F]">
                {inspection.kodeInspeksi}
              </div>
              <div className="text-[11px] text-slate-500">
                Tgl Input: {inspection.tanggalPelaksanaan}
              </div>
            </div>
          </div>

          {/* River Segment Metadata Grid (Without Panjang Sungai & Jenis Prasarana Utama) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-2">
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Nama Sungai
                </span>
                <span className="col-span-7 font-bold text-slate-900">
                  : {inspection.namaSungai}
                </span>
              </div>
              {category === 'kinerja_prasarana' && (
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-slate-500 font-medium">
                    Nama Bangunan
                  </span>
                  <span className="col-span-7 font-bold text-[#1B65A6]">
                    : {inspection.namaPrasarana || '-'}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Nama WS
                </span>
                <span className="col-span-7 font-semibold text-[#0B2C5F]">
                  : {inspection.namaWs}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Desa / Kecamatan
                </span>
                <span className="col-span-7 text-slate-800">
                  : Desa {inspection.desa}, Kec. {inspection.kecamatan}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Kabupaten / Kota
                </span>
                <span className="col-span-7 text-slate-800">
                  : {inspection.kabupatenKota}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Balai PSDA
                </span>
                <span className="col-span-7 font-semibold text-[#1B65A6]">
                  : {inspection.balaiPsda}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  No. Ruas
                </span>
                <span className="col-span-7 font-bold text-slate-900">
                  : {inspection.noRuas}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Panjang Ruas
                </span>
                <span className="col-span-7 font-mono font-semibold text-slate-800">
                  : {inspection.panjangRuasKm} Km
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Koordinat Awal (X,Y)
                </span>
                <span className="col-span-7 font-mono text-slate-800">
                  : {inspection.koordinatAwal}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Koordinat Akhir (X,Y)
                </span>
                <span className="col-span-7 font-mono text-slate-800">
                  : {inspection.koordinatAkhir}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Tgl Pelaksanaan
                </span>
                <span className="col-span-7 font-mono text-slate-800">
                  : {inspection.tanggalPelaksanaan}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-slate-500 font-medium">
                  Inspektor (Otomatis)
                </span>
                <span className="col-span-7 font-semibold text-slate-900">
                  : {inspection.inspectorName}{' '}
                  <span className="font-mono text-[11px] text-slate-500">
                    (NIP. {inspection.inspectorNip})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Summary Table */}
          <div>
            <h3 className="font-display text-sm font-bold text-[#0B2C5F] mb-2.5 uppercase">
              {category === 'kinerja_prasarana'
                ? 'REKAPITULASI PENILAIAN KINERJA PRASARANA SUNGAI'
                : 'REKAPITULASI PENILAIAN KOMPONEN FISIK SUNGAI (PER RUAS)'}
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0B2C5F] text-white">
                    <th className="py-2.5 px-3 text-center font-semibold w-12">
                      NO
                    </th>
                    <th className="py-2.5 px-3 text-left font-semibold">
                      {category === 'kinerja_prasarana'
                        ? 'PARAMETER KINERJA PRASARANA'
                        : 'KOMPONEN SUNGAI'}
                    </th>
                    <th className="py-2.5 px-3 text-right font-mono font-semibold w-32">
                      {category === 'kinerja_prasarana'
                        ? 'Nilai Kinerja (%)'
                        : 'Nilai Fisik (%)'}
                    </th>
                    <th className="py-2.5 px-3 text-left font-semibold">
                      Keterangan &amp; Dokumentasi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {targetComponents
                    .filter((c) => c.isMainWeighted)
                    .map((comp) => {
                      const res = calc.componentResults[comp.key];
                      const doc = inspection.componentDocs[comp.key];
                      return (
                        <tr key={comp.key} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {comp.no}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {category === 'kinerja_prasarana'
                              ? `${comp.title} — ${inspection.namaPrasarana || ''}`
                              : comp.title}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#0B2C5F]">
                            {res.nilaiFisikKomponen.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {doc?.keterangan || '-'}
                            {doc?.photos?.length ? (
                              <span className="ml-2 font-mono text-[11px] text-[#1B65A6]">
                                ({doc.photos.length} foto)
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 px-3">
                      {category === 'kinerja_prasarana'
                        ? 'TOTAL NILAI KINERJA PRASARANA'
                        : 'TOTAL NILAI KONDISI FISIK (NKF)'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm tabular-nums text-[#0B2C5F]">
                      {calc.nkfTotal.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${
                          calc.nkfTotal > 70
                            ? 'text-emerald-700'
                            : calc.nkfTotal >= 50
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {calc.physicalStatusLabel}
                      </span>{' '}
                      · {calc.riskLevel} · {calc.performanceLevel} ·{' '}
                      <span className="underline">
                        {calc.maintenanceAction}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed Sub-Component Tables & Optional Documentation */}
          <div className="space-y-5">
            <h3 className="font-display text-sm font-bold text-[#0B2C5F]">
              RINCIAN PENILAIAN &amp; DOKUMENTASI
            </h3>

            {targetComponents.map((comp) => {
              const res = calc.componentResults[comp.key];
              const doc = inspection.componentDocs[comp.key];
              const subPhotos = res.subResults.flatMap(
                (s) => s.photos || []
              );
              const displayPhotos =
                subPhotos.length > 0 ? subPhotos : doc?.photos || [];

              return (
                <div
                  key={comp.key}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white"
                >
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-display text-xs font-bold text-[#0B2C5F] uppercase">
                      {comp.no}. {comp.title}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-800">
                      Nilai Komponen: {res.nilaiFisikKomponen.toFixed(2)}%
                    </div>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3 text-center w-10">NO</th>
                        <th className="py-2 px-3 text-left">
                          Sub-Komponen Penilaian
                        </th>
                        <th className="py-2 px-3 text-right font-mono w-24">
                          Nilai (%)
                        </th>
                        <th className="py-2 px-3 text-left">
                          Kondisi Lapangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {res.subResults.map((sub) => (
                        <tr key={sub.subId}>
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            {sub.no}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            <div>{sub.name}</div>
                            {(sub.keterangan || sub.docLink) && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {sub.keterangan}
                                {sub.docLink && (
                                  <a
                                    href={sub.docLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-[#1B65A6] hover:underline inline-flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Link
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-[#0B2C5F]">
                            {sub.nilaiFisik}%
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {sub.conditionLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {displayPhotos.length > 0 && (
                    <div className="p-4 bg-slate-50/60 border-t border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {displayPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="rounded-lg overflow-hidden border border-slate-200 bg-white"
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              referrerPolicy="no-referrer"
                              className="w-full h-36 object-cover"
                            />
                            <div className="p-2 text-[11px] text-slate-700 font-medium">
                              {photo.caption}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Follow-up Status Management Panel (No-Print) */}
          <div className="no-print border border-sky-200 rounded-xl p-5 bg-sky-50/50">
            <h3 className="font-display text-sm font-bold text-[#0B2C5F] mb-3">
              Tindak Lanjut Temuan Lapangan &amp; Verifikasi
            </h3>
            <form
              onSubmit={handleSaveFollowUp}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Tindak Lanjut
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) =>
                    setFollowUpStatus(e.target.value as FollowUpStatus)
                  }
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                >
                  <option value="Aman / Terkendali">Aman / Terkendali</option>
                  <option value="Perlu Tindak Lanjut">
                    Perlu Tindak Lanjut
                  </option>
                  <option value="Dalam Penanganan">Dalam Penanganan</option>
                  <option value="Selesai Ditindaklanjuti">
                    Selesai Ditindaklanjuti
                  </option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penanganan / Disposisi Teknis
                </label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Catatan verifikasi atau progres penanganan..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-[#1B65A6] outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-[#0B2C5F] hover:bg-[#1B65A6] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Status
                </button>
              </div>
            </form>

            {saveFeedback && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Status tindak lanjut berhasil diperbarui.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

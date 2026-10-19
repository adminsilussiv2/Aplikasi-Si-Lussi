import {
  RiverInspection,
  calculateInspectionScores,
  getComponentsByCategory,
} from '../types/silussi';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportInspectionToCsv(inspection: RiverInspection) {
  const category = inspection.category || 'fisik_sungai';
  const targetComponents = getComponentsByCategory(category);
  const calc = calculateInspectionScores(inspection.subValues, category);
  const rows: (string | number)[][] = [];

  const titleLabel =
    category === 'kinerja_prasarana'
      ? 'PENILAIAN KINERJA PRASARANA SUNGAI'
      : 'PENILAIAN KONDISI FISIK SUNGAI ( PER RUAS )';

  rows.push(['PEMERINTAH PROVINSI JAWA TENGAH']);
  rows.push(['DINAS PEKERJAAN UMUM DAN PENATAAN RUANG PROVINSI JAWA TENGAH']);
  rows.push([`${titleLabel} — SI-LUSSI v2`]);
  rows.push([]);
  rows.push([
    'Nama Sungai',
    ':',
    inspection.namaSungai,
    '',
    'No. Ruas',
    ':',
    inspection.noRuas,
  ]);
  if (category === 'kinerja_prasarana') {
    rows.push([
      'Nama Bangunan',
      ':',
      inspection.namaPrasarana || '-',
      '',
      'Panjang Ruas',
      ':',
      `${inspection.panjangRuasKm} Km`,
    ]);
  } else {
    rows.push([
      'Nama WS',
      ':',
      inspection.namaWs,
      '',
      'Panjang Ruas',
      ':',
      `${inspection.panjangRuasKm} Km`,
    ]);
  }
  rows.push([
    'Desa / Kecamatan',
    ':',
    `Desa ${inspection.desa}, Kec. ${inspection.kecamatan}`,
    '',
    'Koordinat Awal',
    ':',
    inspection.koordinatAwal,
  ]);
  rows.push([
    'Kabupaten / Kota',
    ':',
    inspection.kabupatenKota,
    '',
    'Koordinat Akhir',
    ':',
    inspection.koordinatAkhir,
  ]);
  rows.push([
    'Balai PSDA',
    ':',
    inspection.balaiPsda,
    '',
    'Tgl Pelaksanaan',
    ':',
    inspection.tanggalPelaksanaan,
  ]);
  rows.push([
    'Wilayah Sungai',
    ':',
    inspection.namaWs,
    '',
    'Inspektor Pelapor',
    ':',
    `${inspection.inspectorName} (NIP. ${inspection.inspectorNip})`,
  ]);
  rows.push([]);

  // Main Summary Table
  rows.push([
    'NO',
    category === 'kinerja_prasarana'
      ? 'PARAMETER KINERJA PRASARANA'
      : 'KOMPONEN SUNGAI',
    'Nilai Bobot (%)',
    'Nilai Fisik / Kinerja (%)',
    'Nilai Kondisi / Kinerja (%)',
    'Keterangan & Dokumentasi',
  ]);

  for (const comp of targetComponents) {
    if (!comp.isMainWeighted) continue;
    const res = calc.componentResults[comp.key];
    const doc = inspection.componentDocs[comp.key];
    rows.push([
      comp.no,
      comp.title,
      comp.bobotInduk,
      res.nilaiFisikKomponen.toFixed(2),
      res.nilaiKondisiFisikTertimbang.toFixed(2),
      `${doc?.keterangan || '-'}${doc?.docLink ? ` | Link: ${doc.docLink}` : ''} | Foto: ${doc?.photos?.length || 0}`,
    ]);
  }

  rows.push([]);
  rows.push([
    '',
    category === 'kinerja_prasarana'
      ? 'TOTAL NILAI KINERJA PRASARANA'
      : 'TOTAL NILAI KONDISI FISIK (NKF)',
    '100',
    '',
    calc.nkfTotal.toFixed(2),
    `${calc.physicalStatusLabel} — ${calc.riskLevel} — ${calc.performanceLevel} — ${calc.maintenanceAction}`,
  ]);
  rows.push([]);

  // Each Component Sub-table
  for (const comp of targetComponents) {
    const res = calc.componentResults[comp.key];
    rows.push([
      'NO',
      comp.title,
      'Nilai Bobot (%)',
      'Nilai (%)',
      'Kondisi Lapangan (Fungsi IF / Angka Tarik)',
      'Nilai Tertimbang (%)',
      'Dokumentasi (Opsional)',
    ]);
    for (const sub of res.subResults) {
      rows.push([
        sub.no,
        sub.name,
        sub.bobot,
        sub.nilaiFisik,
        sub.conditionLabel,
        sub.nilaiKondisiFisik.toFixed(2),
        sub.docLink || sub.keterangan || '-',
      ]);
    }
    rows.push([
      '',
      'JUMLAH NILAI',
      '100',
      '',
      '',
      res.nilaiFisikKomponen.toFixed(2),
      '',
    ]);
    rows.push([]);
  }

  const csvContent =
    '\uFEFF' +
    rows
      .map((r) => r.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const safeName = inspection.namaSungai.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(
    blob,
    `Blangko_SiLussi_${inspection.kodeInspeksi}_${safeName}.csv`
  );
}

export function exportInspectionToExcelHtml(inspection: RiverInspection) {
  const category = inspection.category || 'fisik_sungai';
  const targetComponents = getComponentsByCategory(category);
  const calc = calculateInspectionScores(inspection.subValues, category);

  const titleLabel =
    category === 'kinerja_prasarana'
      ? 'PENILAIAN KINERJA PRASARANA SUNGAI'
      : 'PENILAIAN KONDISI FISIK SUNGAI ( PER RUAS )';

  const subTablesHtml = targetComponents
    .map((comp) => {
      const res = calc.componentResults[comp.key];
      const subRows = res.subResults
        .map(
          (sub) => `
      <tr>
        <td style="text-align:center;">${sub.no}</td>
        <td>${sub.name}</td>
        <td style="text-align:center;">${sub.bobot}</td>
        <td style="text-align:center;font-weight:bold;">${sub.nilaiFisik}</td>
        <td>${sub.conditionLabel}</td>
        <td style="text-align:right;font-weight:bold;">${sub.nilaiKondisiFisik.toFixed(2)}</td>
      </tr>`
        )
        .join('');

      return `
      <br/>
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
        <thead>
          <tr style="background:#0B2C5F;color:#ffffff;font-weight:bold;">
            <th style="width:45px;">NO</th>
            <th>${comp.title.toUpperCase()}</th>
            <th style="width:110px;">Nilai Bobot (%)</th>
            <th style="width:110px;">Nilai (%)</th>
            <th>Kriteria Kondisi Lapangan (IF / Angka Tarik)</th>
            <th style="width:140px;">Nilai Tertimbang (%)</th>
          </tr>
        </thead>
        <tbody>
          ${subRows}
          <tr style="background:#F1F5F9;font-weight:bold;">
            <td></td>
            <td>JUMLAH NILAI</td>
            <td style="text-align:center;">100</td>
            <td></td>
            <td></td>
            <td style="text-align:right;">${res.nilaiFisikKomponen.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    `;
    })
    .join('');

  const mainRowsHtml = targetComponents
    .filter((c) => c.isMainWeighted)
    .map((comp) => {
      const res = calc.componentResults[comp.key];
      const doc = inspection.componentDocs[comp.key];
      return `
        <tr>
          <td style="text-align:center;">${comp.no}</td>
          <td>${comp.title}</td>
          <td style="text-align:center;">${comp.bobotInduk}</td>
          <td style="text-align:center;">${res.nilaiFisikKomponen.toFixed(2)}</td>
          <td style="text-align:right;font-weight:bold;">${res.nilaiKondisiFisikTertimbang.toFixed(2)}</td>
          <td>${doc?.keterangan || '-'} (${doc?.photos?.length || 0} foto)</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8" />
    </head>
    <body style="font-family:Arial,sans-serif;font-size:12px;">
      <h2 style="margin:0;color:#0B2C5F;">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG PROVINSI JAWA TENGAH</h2>
      <h3 style="margin:4px 0 12px 0;">${titleLabel} — SI-LUSSI v2</h3>
      <table border="0" cellpadding="4" style="margin-bottom:12px;font-size:12px;">
        <tr>
          <td><b>Nama Sungai</b></td><td>: ${inspection.namaSungai}</td>
          <td style="width:40px;"></td>
          <td><b>No. Ruas</b></td><td>: ${inspection.noRuas}</td>
        </tr>
        ${
          category === 'kinerja_prasarana'
            ? `<tr>
          <td><b>Nama Bangunan</b></td><td>: ${inspection.namaPrasarana || '-'}</td>
          <td></td>
          <td><b>Panjang Ruas</b></td><td>: ${inspection.panjangRuasKm} Km</td>
        </tr>`
            : `<tr>
          <td><b>Nama WS</b></td><td>: ${inspection.namaWs}</td>
          <td></td>
          <td><b>Panjang Ruas</b></td><td>: ${inspection.panjangRuasKm} Km</td>
        </tr>`
        }
        <tr>
          <td><b>Desa / Kecamatan</b></td><td>: Desa ${inspection.desa}, Kec. ${inspection.kecamatan}</td>
          <td></td>
          <td><b>Koordinat Awal / Akhir</b></td><td>: ${inspection.koordinatAwal} s/d ${inspection.koordinatAkhir}</td>
        </tr>
        <tr>
          <td><b>Kabupaten / Kota</b></td><td>: ${inspection.kabupatenKota}</td>
          <td></td>
          <td><b>Tgl Pelaksanaan</b></td><td>: ${inspection.tanggalPelaksanaan}</td>
        </tr>
        <tr>
          <td><b>Balai PSDA</b></td><td>: ${inspection.balaiPsda}</td>
          <td></td>
          <td><b>Inspektor</b></td><td>: ${inspection.inspectorName} (NIP. ${inspection.inspectorNip})</td>
        </tr>
      </table>

      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#0B2C5F;color:#ffffff;font-weight:bold;">
            <th style="width:45px;">NO</th>
            <th>${category === 'kinerja_prasarana' ? 'PARAMETER KINERJA PRASARANA' : 'KOMPONEN SUNGAI'}</th>
            <th style="width:110px;">Nilai Bobot (%)</th>
            <th style="width:110px;">Nilai (%)</th>
            <th style="width:140px;">Nilai Kondisi / Kinerja (%)</th>
            <th>Keterangan &amp; Dokumentasi</th>
          </tr>
        </thead>
        <tbody>
          ${mainRowsHtml}
          <tr style="background:#E2E8F0;font-weight:bold;">
            <td colspan="2">TOTAL NILAI KONDISI / KINERJA (NKF)</td>
            <td style="text-align:center;">100</td>
            <td style="text-align:center;">-</td>
            <td style="text-align:right;font-size:14px;">${calc.nkfTotal.toFixed(2)}%</td>
            <td>${calc.physicalStatusLabel} (${calc.riskLevel} — ${calc.performanceLevel} — ${calc.maintenanceAction})</td>
          </tr>
        </tbody>
      </table>

      ${subTablesHtml}
    </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const safeName = inspection.namaSungai.replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerDownload(
    blob,
    `Blangko_SiLussi_${inspection.kodeInspeksi}_${safeName}.xls`
  );
}

export function exportAllInspectionsSummaryToCsv(
  inspections: RiverInspection[]
) {
  const headers = [
    'Kode Inspeksi',
    'Jenis Inspeksi',
    'Tanggal Pelaksanaan',
    'Nama Sungai',
    'Nama Bangunan Prasarana',
    'No. Ruas',
    'Wilayah Sungai (WS)',
    'Balai PSDA',
    'Desa',
    'Kecamatan',
    'Kabupaten/Kota',
    'Panjang Ruas (Km)',
    'Koordinat Awal',
    'Koordinat Akhir',
    'Nama Inspektor (Otomatis)',
    'NIP Inspektor',
    'Total Skor NKF / Kinerja (%)',
    'Status Kondisi Fisik',
    'Tingkat Risiko',
    'Kinerja Sungai/Prasarana',
    'Rekomendasi Pemeliharaan',
    'Status Tindak Lanjut',
  ];

  const rows = inspections.map((insp) => {
    const calc = calculateInspectionScores(
      insp.subValues,
      insp.category || 'fisik_sungai'
    );
    return [
      insp.kodeInspeksi,
      insp.category === 'kinerja_prasarana'
        ? 'Kinerja Prasarana Sungai'
        : 'Kondisi Fisik Sungai',
      insp.tanggalPelaksanaan,
      insp.namaSungai,
      insp.namaPrasarana || '-',
      insp.noRuas,
      insp.namaWs,
      insp.balaiPsda,
      insp.desa,
      insp.kecamatan,
      insp.kabupatenKota,
      insp.panjangRuasKm,
      insp.koordinatAwal,
      insp.koordinatAkhir,
      insp.inspectorName,
      insp.inspectorNip,
      calc.nkfTotal.toFixed(2),
      calc.physicalStatusLabel,
      calc.riskLevel,
      calc.performanceLevel,
      calc.maintenanceAction,
      insp.followUpStatus,
    ];
  });

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((r) => r.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(
    blob,
    `Rekapitulasi_Inspeksi_SiLussi_DPUPR_Jateng_${new Date().toISOString().slice(0, 10)}.csv`
  );
}

export function exportAllInspectionsComprehensiveExcelHtml(
  inspections: RiverInspection[]
) {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tableRows = inspections
    .map((insp, idx) => {
      const calc = calculateInspectionScores(
        insp.subValues,
        insp.category || 'fisik_sungai'
      );
      const isPras = insp.category === 'kinerja_prasarana';
      const riskColor =
        calc.riskLevel === 'Risiko Rendah (RR)'
          ? '#D1FAE5'
          : calc.riskLevel === 'Risiko Sedang (RS)'
            ? '#FEF3C7'
            : '#FEE2E2';

      const palungScore = calc.componentResults.palung?.nilaiFisikKomponen?.toFixed(2) || '-';
      const bantaranKananScore = calc.componentResults.bantaranKanan?.nilaiFisikKomponen?.toFixed(2) || '-';
      const bantaranKiriScore = calc.componentResults.bantaranKiri?.nilaiFisikKomponen?.toFixed(2) || '-';
      const sempadanKananScore = calc.componentResults.sempadanKanan?.nilaiFisikKomponen?.toFixed(2) || '-';
      const sempadanKiriScore = calc.componentResults.sempadanKiri?.nilaiFisikKomponen?.toFixed(2) || '-';
      const muaraScore = calc.componentResults.muara?.nilaiFisikKomponen?.toFixed(2) || '-';
      const limbahScore = calc.componentResults.buanganLimbah?.nilaiFisikKomponen?.toFixed(2) || '-';
      const prasaranaScore = calc.componentResults.kinerjaPrasarana?.nilaiFisikKomponen?.toFixed(2) || '-';

      const links = [insp.linkDokumentasi1, insp.linkDokumentasi2, insp.linkDokumentasi3]
        .filter(Boolean)
        .join('; ');

      return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="font-family:monospace;font-weight:bold;">${insp.kodeInspeksi}</td>
        <td>${isPras ? 'Kinerja Prasarana' : 'Kondisi Fisik'}</td>
        <td style="font-weight:bold;">${insp.namaSungai}</td>
        <td>${insp.namaPrasarana || '-'}</td>
        <td style="text-align:center;">${insp.noRuas}</td>
        <td>${insp.namaWs}</td>
        <td>${insp.balaiPsda}</td>
        <td>Desa ${insp.desa}, Kec. ${insp.kecamatan}, ${insp.kabupatenKota}</td>
        <td style="text-align:right;">${insp.panjangRuasKm || '-'}</td>
        <td style="font-family:monospace;font-size:11px;">${insp.koordinatAwal}</td>
        <td style="font-family:monospace;font-size:11px;">${insp.koordinatAkhir}</td>
        <td style="text-align:center;">${insp.tanggalPelaksanaan}</td>
        <td>${insp.inspectorName}</td>
        <td style="font-family:monospace;">${insp.inspectorNip}</td>
        <td style="text-align:right;font-weight:bold;font-size:13px;">${calc.nkfTotal.toFixed(2)}%</td>
        <td style="background:${riskColor};text-align:center;font-weight:bold;">${calc.riskLevel}</td>
        <td style="text-align:center;">${calc.performanceLevel}</td>
        <td>${calc.maintenanceAction}</td>
        <td style="font-weight:bold;">${insp.followUpStatus}</td>
        <td>${insp.followUpNotes || '-'}</td>
        <td style="text-align:right;">${palungScore}</td>
        <td style="text-align:right;">${bantaranKananScore}</td>
        <td style="text-align:right;">${bantaranKiriScore}</td>
        <td style="text-align:right;">${sempadanKananScore}</td>
        <td style="text-align:right;">${sempadanKiriScore}</td>
        <td style="text-align:right;">${muaraScore}</td>
        <td style="text-align:right;">${limbahScore}</td>
        <td style="text-align:right;">${prasaranaScore}</td>
        <td>${links || '-'}</td>
      </tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Rekap Seluruh Inputan Si-Lussi v2</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #0B2C5F; color: #ffffff; padding: 8px 6px; font-size: 11px; border: 1px solid #cbd5e1; }
        td { padding: 6px 5px; border: 1px solid #cbd5e1; vertical-align: top; }
        .header-box { background: #f8fafc; padding: 12px; margin-bottom: 12px; border: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header-box">
        <h2 style="margin:0;color:#0B2C5F;font-size:16px;">PEMERINTAH PROVINSI JAWA TENGAH</h2>
        <h3 style="margin:4px 0 0;color:#1B65A6;font-size:14px;">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (DPUPR)</h3>
        <p style="margin:4px 0 0;font-size:12px;color:#334155;">
          <b>REKAPITULASI MASTER SELURUH INPUTAN BLANGKO PENILAIAN SUNGAI (SI-LUSSI v2)</b><br/>
          Tanggal Cetak: ${dateStr} · Total Data Inputan: <b>${inspections.length} Ruas / Prasarana</b>
        </p>
      </div>

      <table border="1" cellspacing="0" cellpadding="5">
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th>Kode Inspeksi</th>
            <th>Kategori Inputan</th>
            <th>Nama Sungai</th>
            <th>Nama Bangunan / Prasarana</th>
            <th>No. Ruas</th>
            <th>Wilayah Sungai (WS)</th>
            <th>Balai PSDA</th>
            <th>Lokasi Administratif</th>
            <th>Panjang (Km)</th>
            <th>Koordinat Awal</th>
            <th>Koordinat Akhir</th>
            <th>Tgl Inspeksi</th>
            <th>Petugas Inspektor</th>
            <th>NIP Inspektor</th>
            <th>Total Skor NKF (%)</th>
            <th>Tingkat Risiko</th>
            <th>Tingkat Kinerja</th>
            <th>Rekomendasi Pemeliharaan</th>
            <th>Status Tindak Lanjut</th>
            <th>Catatan Tindak Lanjut</th>
            <th>Palung (%)</th>
            <th>Bantaran Ka (%)</th>
            <th>Bantaran Ki (%)</th>
            <th>Sempadan Ka (%)</th>
            <th>Sempadan Ki (%)</th>
            <th>Muara (%)</th>
            <th>Limbah (%)</th>
            <th>Kinerja Prasarana (%)</th>
            <th>Link Bukti Dokumentasi</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  triggerDownload(
    blob,
    `Rekapitulasi_Master_Semua_Inputan_SiLussi_${new Date().toISOString().slice(0, 10)}.xls`
  );
}

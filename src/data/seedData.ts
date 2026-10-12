import {
  ActivityLog,
  ComponentDocumentation,
  ComponentKey,
  InspectionCategory,
  RiverInspection,
  SubComponentValue,
  UserAccount,
  calculateInspectionScores,
  getComponentsByCategory,
  getMatchingIfLabel,
} from '../types/silussi';

import imgPalung from '../assets/images/doc_palung_sungai_sedimentasi_1791650792229.jpg';
import imgBantaran from '../assets/images/doc_bantaran_sungai_vegetasi_1791650809177.jpg';
import imgSempadan from '../assets/images/doc_sempadan_sungai_patok_1791650821012.jpg';
import imgMuaraLimbah from '../assets/images/doc_muara_limbah_pantau_1791650836912.jpg';

export const FIELD_SAMPLE_PHOTOS = {
  palung: imgPalung,
  bantaran: imgBantaran,
  sempadan: imgSempadan,
  muaraLimbah: imgMuaraLimbah,
};

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    name: 'Muhammad Irfan Rosyid, ST',
    email: 'admin@pupr.jatengprov.go.id',
    password: 'Silussi-v2',
    nip: '199806232022031010',
    jabatan: 'Ahli Pertama - Teknik Pengairan',
    balaiPsda: 'BPSDA Jratun Seluna',
    role: 'admin',
    status: 'approved',
    registeredAt: '2026-01-10T08:00:00.000Z',
    approvedAt: '2026-01-10T08:00:00.000Z',
    approvedBy: 'Sistem DPUPR Jateng',
  },
  {
    id: 'usr-insp-01',
    name: 'Budi Santoso, S.T.',
    email: 'budi.santoso@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19890618 201402 1 002',
    jabatan: 'Inspektor Sungai Lapangan',
    balaiPsda: 'BPSDA Pemali Comal',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-02-05T09:15:00.000Z',
    approvedAt: '2026-02-05T10:00:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-02',
    name: 'Siti Rahmawati, S.T., M.Eng.',
    email: 'siti.rahmawati@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19911124 201503 2 005',
    jabatan: 'Inspektor Operasi & Pemeliharaan',
    balaiPsda: 'BPSDA Jratun Seluna',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-02-12T08:30:00.000Z',
    approvedAt: '2026-02-12T11:20:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-03',
    name: 'Agus Prasetyo, S.T.',
    email: 'agus.prasetyo@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19870309 201201 1 008',
    jabatan: 'Inspektor Hidrologi & Alur',
    balaiPsda: 'BPSDA Bengawan Solo',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-03-01T08:00:00.000Z',
    approvedAt: '2026-03-01T09:45:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-04',
    name: 'Dewi Lestari, S.T.',
    email: 'dewi.lestari@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19930815 201802 2 001',
    jabatan: 'Inspektor Sungai & Sempadan',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    role: 'inspector',
    status: 'approved',
    registeredAt: '2026-03-10T08:00:00.000Z',
    approvedAt: '2026-03-10T10:15:00.000Z',
    approvedBy: 'Muhammad Irfan Rosyid, ST',
  },
  {
    id: 'usr-insp-pending-01',
    name: 'Rizky Pratama, S.T.',
    email: 'rizky.pratama@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19950214 202203 1 003',
    jabatan: 'Inspektor Pemantau Lapangan',
    balaiPsda: 'BPSDA Pemali Comal',
    role: 'inspector',
    status: 'pending',
    registeredAt: '2026-10-09T14:20:00.000Z',
  },
  {
    id: 'usr-insp-pending-02',
    name: 'Wahyu Nugroho, S.T.',
    email: 'wahyu.nugroho@pupr.jatengprov.go.id',
    password: 'password123',
    nip: '19940928 202102 1 007',
    jabatan: 'Inspektor Morfologi Sungai',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    role: 'inspector',
    status: 'pending',
    registeredAt: '2026-10-10T07:45:00.000Z',
  },
];

function buildSubValuesAndDocs(
  scoresMap: Record<string, number>,
  notes: Partial<Record<ComponentKey, string>>,
  kodeInspeksi: string,
  category: InspectionCategory
): {
  subValues: Record<string, SubComponentValue>;
  componentDocs: Record<string, ComponentDocumentation>;
} {
  const subValues: Record<string, SubComponentValue> = {};
  const componentDocs: Record<string, ComponentDocumentation> = {};
  const comps = getComponentsByCategory(category);

  for (const comp of comps) {
    const sampleUrl =
      comp.key === 'palung' || comp.key === 'kinerjaPrasarana'
        ? imgPalung
        : comp.key === 'bantaranKanan' || comp.key === 'bantaranKiri'
        ? imgBantaran
        : comp.key === 'sempadanKanan' || comp.key === 'sempadanKiri'
        ? imgSempadan
        : imgMuaraLimbah;

    const firstSub = comp.subComponents[0];
    const compNote =
      notes[comp.key] ||
      `Dokumentasi pengamatan ${comp.shortTitle} (${kodeInspeksi}).`;
    const compLink = `https://drive.pupr.jatengprov.go.id/silussi/${kodeInspeksi.toLowerCase()}/${comp.key}`;

    comp.subComponents.forEach((sub, idx) => {
      const score = scoresMap[sub.id] ?? 80;
      const attachSample =
        idx === 0 &&
        (comp.key === 'palung' ||
          comp.key === 'bantaranKanan' ||
          comp.key === 'sempadanKanan' ||
          comp.key === 'kinerjaPrasarana');

      const photos = attachSample
        ? [
            {
              id: `ph-${sub.id}-${kodeInspeksi}`,
              url: sampleUrl,
              caption: `Dokumentasi ${sub.name} (${kodeInspeksi})`,
              uploadedAt: '2026-10-08T09:30:00.000Z',
            },
          ]
        : [];

      subValues[sub.id] = {
        subId: sub.id,
        nilaiFisik: score,
        conditionLabel: getMatchingIfLabel(sub, score),
        keterangan: idx === 0 ? compNote : '',
        docLink: idx === 0 ? compLink : '',
        photos,
      };
    });

    const firstSubVal = subValues[firstSub.id];
    componentDocs[comp.key] = {
      componentKey: comp.key,
      keterangan: compNote,
      docLink: compLink,
      photos: firstSubVal?.photos || [],
    };
  }

  return { subValues, componentDocs };
}

function createSeedInspection(
  params: Omit<
    RiverInspection,
    | 'subValues'
    | 'componentDocs'
    | 'nkfTotal'
    | 'muaraScore'
    | 'riskLevel'
    | 'performanceLevel'
    | 'maintenanceAction'
    | 'physicalStatusLabel'
  > & {
    scoresMap: Record<string, number>;
    notes?: Partial<Record<ComponentKey, string>>;
  }
): RiverInspection {
  const category = params.category || 'fisik_sungai';
  const { subValues, componentDocs } = buildSubValuesAndDocs(
    params.scoresMap,
    params.notes || {},
    params.kodeInspeksi,
    category
  );
  const calc = calculateInspectionScores(subValues, category);
  const docKeys = Object.keys(componentDocs);

  return {
    id: params.id,
    category,
    kodeInspeksi: params.kodeInspeksi,
    namaSungai: params.namaSungai,
    namaPrasarana: params.namaPrasarana,
    noRuas: params.noRuas,
    panjangRuasKm: params.panjangRuasKm,
    namaWs: params.namaWs,
    desa: params.desa,
    kecamatan: params.kecamatan,
    kabupatenKota: params.kabupatenKota,
    balaiPsda: params.balaiPsda,
    koordinatAwal: params.koordinatAwal,
    koordinatAkhir: params.koordinatAkhir,
    tanggalPelaksanaan: params.tanggalPelaksanaan,
    createdAt: params.createdAt,
    inspectorId: params.inspectorId,
    inspectorName: params.inspectorName,
    inspectorNip: params.inspectorNip,
    inspectorBalai: params.inspectorBalai,
    subValues,
    componentDocs,
    linkDokumentasi1: componentDocs[docKeys[0]]?.docLink || '',
    linkDokumentasi2: componentDocs[docKeys[1]]?.docLink || '',
    linkDokumentasi3: componentDocs[docKeys[2]]?.docLink || '',
    nkfTotal: calc.nkfTotal,
    muaraScore: calc.muaraScore,
    includeMuaraInSummary: params.includeMuaraInSummary,
    riskLevel: calc.riskLevel,
    performanceLevel: calc.performanceLevel,
    maintenanceAction: calc.maintenanceAction,
    physicalStatusLabel: calc.physicalStatusLabel,
    followUpStatus: params.followUpStatus,
    followUpNotes: params.followUpNotes,
    verifiedBy: params.verifiedBy,
    verifiedAt: params.verifiedAt,
  };
}

export const INITIAL_INSPECTIONS: RiverInspection[] = [
  createSeedInspection({
    id: 'insp-2026-001',
    category: 'fisik_sungai',
    kodeInspeksi: 'SL2-FSK-001',
    namaSungai: 'Sungai Pemali',
    noRuas: 'Ruas Pml-04 (Jembatan Brebes - Hilir)',
    panjangRuasKm: 4.8,
    namaWs: 'WS Pemali Comal',
    desa: 'Pasarbatang',
    kecamatan: 'Brebes',
    kabupatenKota: 'Kabupaten Brebes',
    balaiPsda: 'BPSDA Pemali Comal',
    koordinatAwal: '-6.8705, 109.0421',
    koordinatAkhir: '-6.8412, 109.0518',
    tanggalPelaksanaan: '2026-10-04',
    createdAt: '2026-10-04T10:15:00.000Z',
    inspectorId: 'usr-insp-01',
    inspectorName: 'Budi Santoso, S.T.',
    inspectorNip: '19890618 201402 1 002',
    inspectorBalai: 'BPSDA Pemali Comal',
    includeMuaraInSummary: true,
    followUpStatus: 'Perlu Tindak Lanjut',
    followUpNotes:
      'Teridentifikasi sedimentasi berat di dasar alur (>50%) dan penyempitan penampang di sekitar hilir jembatan. Perlu pengerukan terprogram.',
    scoresMap: {
      palung_1: 50,
      palung_2: 50,
      palung_3: 50,
      palung_4: 45,
      palung_5: 50,
      bantaran_kanan_1: 50,
      bantaran_kanan_2: 50,
      bantaran_kiri_1: 50,
      bantaran_kiri_2: 50,
      sempadan_kanan_1: 50,
      sempadan_kanan_2: 50,
      sempadan_kiri_1: 50,
      sempadan_kiri_2: 50,
      muara_1: 70,
      muara_2: 50,
      limbah_1: 50,
    },
    notes: {
      palung:
        'Sedimentasi tinggi membentuk pulau pasir di tengah palung sungai dan menghambat kapasitas debit banjir.',
      bantaranKanan:
        'Vegetasi semak belukar sangat rapat di sepanjang bantaran kanan.',
      sempadanKanan:
        'Terdapat bangunan semi-permanen warga yang masuk ke area sempadan sungai.',
      buanganLimbah:
        'Ditemukan buangan limbah cair domestik pekat pada saluran masuk sisi barat.',
    },
  }),
  createSeedInspection({
    id: 'insp-2026-002',
    category: 'fisik_sungai',
    kodeInspeksi: 'SL2-FSK-002',
    namaSungai: 'Sungai Tuntang',
    noRuas: 'Ruas Ttg-02 (Bendung Glapan - Karangawen)',
    panjangRuasKm: 6.2,
    namaWs: 'WS Seluna',
    desa: 'Kebonagung',
    kecamatan: 'Kebonagung',
    kabupatenKota: 'Kabupaten Demak',
    balaiPsda: 'BPSDA Jratun Seluna',
    koordinatAwal: '-7.0418, 110.6542',
    koordinatAkhir: '-6.9985, 110.6214',
    tanggalPelaksanaan: '2026-10-06',
    createdAt: '2026-10-06T13:40:00.000Z',
    inspectorId: 'usr-insp-02',
    inspectorName: 'Siti Rahmawati, S.T., M.Eng.',
    inspectorNip: '19911124 201503 2 005',
    inspectorBalai: 'BPSDA Jratun Seluna',
    includeMuaraInSummary: false,
    followUpStatus: 'Dalam Penanganan',
    followUpNotes:
      'Tim OP BPSDA Jratun Seluna sedang melakukan pembersihan hambatan ranting dan normalisasi lokal tebing.',
    verifiedBy: 'Muhammad Irfan Rosyid, ST',
    verifiedAt: '2026-10-07T09:00:00.000Z',
    scoresMap: {
      palung_1: 70,
      palung_2: 70,
      palung_3: 65,
      palung_4: 60,
      palung_5: 70,
      bantaran_kanan_1: 70,
      bantaran_kanan_2: 70,
      bantaran_kiri_1: 70,
      bantaran_kiri_2: 80,
      sempadan_kanan_1: 70,
      sempadan_kanan_2: 80,
      sempadan_kiri_1: 70,
      sempadan_kiri_2: 70,
      muara_1: 80,
      muara_2: 70,
      limbah_1: 70,
    },
    notes: {
      palung:
        'Endapan lumpur sedang di sisi dalam tikungan sungai, perlu pemeliharaan korektif berkala.',
      bantaranKanan:
        'Tanaman perdu cukup rapat, dijadwalkan pemangkasan oleh tim OP.',
    },
  }),
  createSeedInspection({
    id: 'insp-2026-003',
    category: 'fisik_sungai',
    kodeInspeksi: 'SL2-FSK-003',
    namaSungai: 'Sungai Serayu',
    noRuas: 'Ruas Sry-07 (Rawalo - Kebasen)',
    panjangRuasKm: 5.5,
    namaWs: 'WS Serayu Citanduy',
    desa: 'Tambaknegara',
    kecamatan: 'Rawalo',
    kabupatenKota: 'Kabupaten Banyumas',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    koordinatAwal: '-7.5284, 109.2051',
    koordinatAkhir: '-7.5512, 109.1840',
    tanggalPelaksanaan: '2026-10-07',
    createdAt: '2026-10-07T15:10:00.000Z',
    inspectorId: 'usr-insp-04',
    inspectorName: 'Dewi Lestari, S.T.',
    inspectorNip: '19930815 201802 2 001',
    inspectorBalai: 'BPSDA Serayu Bogowonto',
    includeMuaraInSummary: false,
    followUpStatus: 'Aman / Terkendali',
    followUpNotes:
      'Kondisi fisik alur dan sempadan sangat baik. Dilanjutkan pemeliharaan preventif rutin.',
    verifiedBy: 'Muhammad Irfan Rosyid, ST',
    verifiedAt: '2026-10-08T08:30:00.000Z',
    scoresMap: {
      palung_1: 90,
      palung_2: 85,
      palung_3: 80,
      palung_4: 80,
      palung_5: 80,
      bantaran_kanan_1: 90,
      bantaran_kanan_2: 90,
      bantaran_kiri_1: 80,
      bantaran_kiri_2: 90,
      sempadan_kanan_1: 90,
      sempadan_kanan_2: 90,
      sempadan_kiri_1: 80,
      sempadan_kiri_2: 90,
      muara_1: 90,
      muara_2: 80,
      limbah_1: 90,
    },
    notes: {
      palung:
        'Kapasitas pengaliran optimal, struktur pengaman tebing berfungsi dengan baik.',
      sempadanKanan:
        'Patok garis sempadan No. 042 dalam kondisi utuh dan terawat.',
    },
  }),
  createSeedInspection({
    id: 'insp-2026-004',
    category: 'kinerja_prasarana',
    kodeInspeksi: 'SL2-PRS-001',
    namaSungai: 'Sungai Bengawan Solo',
    namaPrasarana: 'Perkuatan Tebing',
    noRuas: 'Ruas Bsl-11 (Masaran - Plupuh)',
    panjangRuasKm: 2.4,
    namaWs: 'WS Bengawan Solo',
    desa: 'Sidodadi',
    kecamatan: 'Masaran',
    kabupatenKota: 'Kabupaten Sragen',
    balaiPsda: 'BPSDA Bengawan Solo',
    koordinatAwal: '-7.4619, 110.9284',
    koordinatAkhir: '-7.4410, 110.9412',
    tanggalPelaksanaan: '2026-10-08',
    createdAt: '2026-10-08T11:25:00.000Z',
    inspectorId: 'usr-insp-03',
    inspectorName: 'Agus Prasetyo, S.T.',
    inspectorNip: '19870309 201201 1 008',
    inspectorBalai: 'BPSDA Bengawan Solo',
    includeMuaraInSummary: false,
    followUpStatus: 'Perlu Tindak Lanjut',
    followUpNotes:
      'Teridentifikasi gerusan lokal pada kaki Perkuatan Tebing. Perlu pemeliharaan korektif.',
    scoresMap: {
      nilai_kinerja_prasarana: 66,
    },
    notes: {
      kinerjaPrasarana:
        'Gerusan kaki perkuatan tebing sepanjang 18 meter pada tikungan luar perlu perbaikan pasangan batu.',
    },
  }),
  createSeedInspection({
    id: 'insp-2026-005',
    category: 'fisik_sungai',
    kodeInspeksi: 'SL2-FSK-004',
    namaSungai: 'Sungai Bodri',
    noRuas: 'Ruas Bdr-03 (Pegandon - Patebon Hilir)',
    panjangRuasKm: 5.1,
    namaWs: 'WS Bodri Kuto',
    desa: 'Kartikajaya',
    kecamatan: 'Patebon',
    kabupatenKota: 'Kabupaten Kendal',
    balaiPsda: 'BPSDA Jratun Seluna',
    koordinatAwal: '-6.9124, 110.1842',
    koordinatAkhir: '-6.8745, 110.1930',
    tanggalPelaksanaan: '2026-10-09',
    createdAt: '2026-10-09T16:00:00.000Z',
    inspectorId: 'usr-insp-02',
    inspectorName: 'Siti Rahmawati, S.T., M.Eng.',
    inspectorNip: '19911124 201503 2 005',
    inspectorBalai: 'BPSDA Jratun Seluna',
    includeMuaraInSummary: true,
    followUpStatus: 'Selesai Ditindaklanjuti',
    followUpNotes:
      'Pembersihan alur dan penataan tambatan perahu di muara telah diselesaikan bersama kelompok masyarakat sungai.',
    verifiedBy: 'Muhammad Irfan Rosyid, ST',
    verifiedAt: '2026-10-09T17:30:00.000Z',
    scoresMap: {
      palung_1: 80,
      palung_2: 80,
      palung_3: 80,
      palung_4: 75,
      palung_5: 90,
      bantaran_kanan_1: 80,
      bantaran_kanan_2: 90,
      bantaran_kiri_1: 80,
      bantaran_kiri_2: 80,
      sempadan_kanan_1: 80,
      sempadan_kanan_2: 80,
      sempadan_kiri_1: 80,
      sempadan_kiri_2: 80,
      muara_1: 80,
      muara_2: 75,
      limbah_1: 80,
    },
  }),
  createSeedInspection({
    id: 'insp-2026-006',
    category: 'kinerja_prasarana',
    kodeInspeksi: 'SL2-PRS-002',
    namaSungai: 'Sungai Progo (Sub-Ruas Probolo)',
    namaPrasarana: 'Groundsill',
    noRuas: 'Ruas Prb-01 (Muntilan - Salam)',
    panjangRuasKm: 3.2,
    namaWs: 'WS Probolo',
    desa: 'Seloboro',
    kecamatan: 'Salam',
    kabupatenKota: 'Kabupaten Magelang',
    balaiPsda: 'BPSDA Serayu Bogowonto',
    koordinatAwal: '-7.6142, 110.2784',
    koordinatAkhir: '-7.6419, 110.2610',
    tanggalPelaksanaan: '2026-10-10',
    createdAt: '2026-10-10T08:15:00.000Z',
    inspectorId: 'usr-insp-04',
    inspectorName: 'Dewi Lestari, S.T.',
    inspectorNip: '19930815 201802 2 001',
    inspectorBalai: 'BPSDA Serayu Bogowonto',
    includeMuaraInSummary: false,
    followUpStatus: 'Aman / Terkendali',
    followUpNotes:
      'Struktur Groundsill dan lantai kolam olak berfungsi optimal menahan degradasi dasar sungai.',
    scoresMap: {
      nilai_kinerja_prasarana: 85,
    },
    notes: {
      kinerjaPrasarana:
        'Mercu Groundsill dan lantai apron hilir dalam kondisi utuh serta berfungsi optimal.',
    },
  }),
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-006',
    timestamp: '2026-10-10T08:15:00.000Z',
    actorId: 'usr-insp-04',
    actorName: 'Dewi Lestari, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Serayu Bogowonto',
    actionType: 'CREATE_INSPECTION',
    summary: 'Menginput Kinerja Prasarana Sungai Progo (Groundsill)',
    detail:
      'Skor Kinerja 85.00% — Risiko Rendah (RR) / Kinerja Baik (WS Probolo, Kab. Magelang)',
    relatedId: 'insp-2026-006',
  },
  {
    id: 'log-005',
    timestamp: '2026-10-10T07:45:00.000Z',
    actorId: 'usr-insp-pending-02',
    actorName: 'Wahyu Nugroho, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Serayu Bogowonto',
    actionType: 'REGISTER_ACCOUNT',
    summary: 'Mengajukan pendaftaran akun Inspektor baru',
    detail:
      'NIP 19940928 202102 1 007 — Unit Kerja: BPSDA Serayu Bogowonto (Status: Menunggu Persetujuan Admin)',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-09T17:30:00.000Z',
    actorId: 'usr-admin-01',
    actorName: 'Muhammad Irfan Rosyid, ST',
    actorRole: 'admin',
    actorBalai: 'BPSDA Jratun Seluna',
    actionType: 'UPDATE_FOLLOWUP',
    summary: 'Memperbarui status tindak lanjut Sungai Bodri (Ruas Bdr-03)',
    detail:
      'Status diubah menjadi "Selesai Ditindaklanjuti" setelah verifikasi dokumentasi muara.',
    relatedId: 'insp-2026-005',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-09T14:20:00.000Z',
    actorId: 'usr-insp-pending-01',
    actorName: 'Rizky Pratama, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Pemali Comal',
    actionType: 'REGISTER_ACCOUNT',
    summary: 'Mengajukan pendaftaran akun Inspektor baru',
    detail:
      'NIP 19950214 202203 1 003 — Unit Kerja: BPSDA Pemali Comal (Status: Menunggu Persetujuan Admin)',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-08T11:25:00.000Z',
    actorId: 'usr-insp-03',
    actorName: 'Agus Prasetyo, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Bengawan Solo',
    actionType: 'CREATE_INSPECTION',
    summary: 'Menginput Kinerja Prasarana Sungai Bengawan Solo (Perkuatan Tebing)',
    detail:
      'Skor Kinerja 66.00% — Risiko Sedang (RS) / Kinerja Cukup (Perlu Pemeliharaan Korektif).',
    relatedId: 'insp-2026-004',
  },
  {
    id: 'log-001',
    timestamp: '2026-10-04T10:15:00.000Z',
    actorId: 'usr-insp-01',
    actorName: 'Budi Santoso, S.T.',
    actorRole: 'inspector',
    actorBalai: 'BPSDA Pemali Comal',
    actionType: 'CREATE_INSPECTION',
    summary: 'Menginput Kondisi Fisik Sungai Pemali (Ruas Pml-04)',
    detail:
      'NKF 49.25% — Risiko Tinggi (RT) / RUSAK BERAT (WS Pemali Comal, Kab. Brebes).',
    relatedId: 'insp-2026-001',
  },
];

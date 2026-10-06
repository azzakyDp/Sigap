/**
 * SIGAP Centralized Status & Priority Color Helper.
 * Strictly consumes design tokens registered in src/index.css @theme.
 * DO NOT hardcode status badge styles outside this file.
 */

export const getStatusBadgeClass = (status) => {
  const normalizedStatus = (status || '').toUpperCase();
  switch (normalizedStatus) {
    case 'PENDING_VERIFICATION':
    case 'SUBMITTED':
    case 'UNRESOLVED':
      return 'bg-status-amber-bg text-status-amber-text border-status-amber-border';
    case 'VERIFIED':
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return 'bg-status-blue-bg text-status-blue-text border-status-blue-border';
    case 'RESOLVED':
      return 'bg-status-green-bg text-status-green-text border-status-green-border';
    case 'REJECTED':
      return 'bg-status-red-bg text-status-red-text border-status-red-border';
    case 'DUPLICATE':
      return 'bg-status-orange-bg text-status-orange-text border-status-orange-border';
    case 'CLOSED':
    case 'DRAFT':
    default:
      return 'bg-status-gray-bg text-status-gray-text border-status-gray-border';
  }
};

/**
 * Label Ringkasan Publik (Citizen) - Sesuai mapping status_to_tracking dari Backend.
 * Digunakan untuk tampilan antarmuka masyarakat (CITIZEN).
 */
export const getCitizenStatusLabel = (status) => {
  const normalizedStatus = (status || '').toUpperCase();
  switch (normalizedStatus) {
    case 'PENDING_VERIFICATION':
      return 'Menunggu Verifikasi';
    case 'SUBMITTED':
      return 'Diajukan';
    case 'VERIFIED':
    case 'ASSIGNED':
      return 'Diverifikasi';
    case 'IN_PROGRESS':
      return 'Dalam Penanganan';
    case 'UNRESOLVED':
      return 'Belum Terselesaikan';
    case 'RESOLVED':
    case 'CLOSED':
      return 'Selesai';
    case 'REJECTED':
      return 'Ditolak';
    case 'DUPLICATE':
      return 'Duplikat';
    case 'DRAFT':
      return 'Draft';
    default:
      return status || 'Tidak Diketahui';
  }
};

/**
 * Label Presisi Internal Staf (VERIFIER / OFFICER / ADMIN).
 * Membedakan status mentah secara presisi (VERIFIED = Terverifikasi, ASSIGNED = Ditugaskan, CLOSED = Ditutup).
 */
export const getStaffStatusLabel = (status) => {
  const normalizedStatus = (status || '').toUpperCase();
  switch (normalizedStatus) {
    case 'PENDING_VERIFICATION':
      return 'Menunggu Verifikasi';
    case 'SUBMITTED':
      return 'Diajukan';
    case 'VERIFIED':
      return 'Terverifikasi';
    case 'ASSIGNED':
      return 'Ditugaskan';
    case 'IN_PROGRESS':
      return 'Sedang Ditangani';
    case 'UNRESOLVED':
      return 'Belum Selesai';
    case 'RESOLVED':
      return 'Selesai';
    case 'CLOSED':
      return 'Ditutup';
    case 'REJECTED':
      return 'Ditolak';
    case 'DUPLICATE':
      return 'Duplikat';
    case 'DRAFT':
      return 'Draft';
    default:
      return status || 'Tidak Diketahui';
  }
};

/**
 * Default fallback getStatusLabel:
 * Menggunakan getStaffStatusLabel agar pemanggilan umum yang membutuhkan presisi status tidak kehilangan informasi.
 */
export const getStatusLabel = (status, role = 'STAFF') => {
  if (role === 'CITIZEN') {
    return getCitizenStatusLabel(status);
  }
  return getStaffStatusLabel(status);
};

export const getPriorityBadgeClass = (priority) => {
  const normalizedPriority = (priority || '').toUpperCase();
  switch (normalizedPriority) {
    case 'LOW':
      return 'bg-status-gray-bg text-status-gray-text border-status-gray-border';
    case 'MEDIUM':
      return 'bg-status-amber-bg text-status-amber-text border-status-amber-border';
    case 'HIGH':
      return 'bg-status-orange-bg text-status-orange-text border-status-orange-border';
    case 'URGENT':
      return 'bg-status-red-bg text-status-red-text border-status-red-border font-semibold';
    default:
      return 'bg-status-gray-bg text-status-gray-text border-status-gray-border';
  }
};

export const getPriorityLabel = (priority) => {
  const normalizedPriority = (priority || '').toUpperCase();
  switch (normalizedPriority) {
    case 'LOW':
      return 'Rendah';
    case 'MEDIUM':
      return 'Sedang';
    case 'HIGH':
      return 'Tinggi';
    case 'URGENT':
      return 'Darurat';
    default:
      return priority || 'Normal';
  }
};
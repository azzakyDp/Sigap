import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, RefreshCw, AlertCircle, Clock, CheckCircle2, List, Table as TableIcon, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ReportList from '../../components/report/ReportList';
import ReportFilterBar from '../../components/verifier/ReportFilterBar';
import ReportsMapPage from './ReportsMapPage';
import { getReportsQueueApi } from '../../api/workflow';
import Alert from '../../components/ui/Alert';

export default function VerifierQueuePage({ defaultView = 'table' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect if route is /verifier/map
  const isMapRoute = location.pathname === '/verifier/map' || defaultView === 'map';
  const [viewMode, setViewMode] = useState(isMapRoute ? 'map' : 'table');

  const [activeTab, setActiveTab] = useState('PENDING_VERIFICATION');

  // Filter state (Shared between Table and Map view)
  const [filters, setFilters] = useState({
    status: 'PENDING_VERIFICATION',
    category_id: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  // Table State
  const [reports, setReports] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState(null);

  // Server pagination state (Table View)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Map State
  const [mapReports, setMapReports] = useState([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapTotal, setMapTotal] = useState(0);

  const fetchTableQueue = async (currentPage = page, currentFilters = filters) => {
    setLoadingTable(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };

      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.category_id) params.category_id = currentFilters.category_id;
      if (currentFilters.start_date) params.start_date = currentFilters.start_date;
      if (currentFilters.end_date) params.end_date = currentFilters.end_date;

      const data = await getReportsQueueApi(params);
      setReports(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error('Gagal mengambil antrean laporan:', err);
      setError(getErrorMessage(err, 'Gagal memuat antrean verifikasi laporan.'));
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchMapData = async (currentFilters = filters) => {
    setLoadingMap(true);
    setError(null);
    try {
      const baseParams = {
        page: 1,
        page_size: 50,
      };

      if (currentFilters.status) baseParams.status = currentFilters.status;
      if (currentFilters.category_id) baseParams.category_id = currentFilters.category_id;
      if (currentFilters.start_date) baseParams.start_date = currentFilters.start_date;
      if (currentFilters.end_date) baseParams.end_date = currentFilters.end_date;

      const firstPage = await getReportsQueueApi(baseParams);
      const total = firstPage.total || 0;
      setMapTotal(total);

      let allItems = firstPage.items || [];
      const totalPagesToFetch = Math.min(firstPage.total_pages || 1, 4); // max 200 items

      if (totalPagesToFetch > 1) {
        const remainingPromises = [];
        for (let p = 2; p <= totalPagesToFetch; p++) {
          remainingPromises.push(getReportsQueueApi({ ...baseParams, page: p }));
        }
        const remainingResults = await Promise.all(remainingPromises);
        remainingResults.forEach((res) => {
          if (res.items) {
            allItems = allItems.concat(res.items);
          }
        });
      }

      setMapReports(allItems);
    } catch (err) {
      console.error('Gagal memuat data peta sebaran:', err);
      setError(getErrorMessage(err, 'Gagal memuat sebaran laporan di peta.'));
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'table') {
      fetchTableQueue(page, filters);
    } else {
      fetchMapData(filters);
    }
  }, [page, filters, viewMode]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
    const newStatus = tabKey === 'ALL' ? undefined : tabKey;
    setFilters((prev) => ({
      ...prev,
      status: newStatus,
    }));
  };

  const handleFilterChange = (newFilters) => {
    setPage(1);
    setFilters(newFilters);
    if (newFilters.status === 'PENDING_VERIFICATION') {
      setActiveTab('PENDING_VERIFICATION');
    } else if (newFilters.status === 'VERIFIED') {
      setActiveTab('VERIFIED');
    } else if (!newFilters.status) {
      setActiveTab('ALL');
    } else {
      setActiveTab('CUSTOM');
    }
  };

  const handleResetFilters = () => {
    setActiveTab('PENDING_VERIFICATION');
    setPage(1);
    setFilters({
      status: 'PENDING_VERIFICATION',
      category_id: undefined,
      start_date: undefined,
      end_date: undefined,
    });
  };

  const handleRefresh = () => {
    if (viewMode === 'table') {
      fetchTableQueue(page, filters);
    } else {
      fetchMapData(filters);
    }
  };

  return (
    <DashboardLayout>
      {/* Header & View Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Antrean Verifikasi Laporan
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            Kelola verifikasi pengaduan, penyesuaian prioritas, dan pantau sebaran lokasi gangguan di peta.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Segmented View Mode Switcher (Tabel vs Peta) */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                if (location.pathname !== '/verifier') navigate('/verifier', { replace: true });
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('map');
                if (location.pathname !== '/verifier/map') navigate('/verifier/map', { replace: true });
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta Sebaran</span>
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={loadingTable || loadingMap}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Fast Tabs */}
      <div className="mb-4 border-b border-border flex items-center gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => handleTabChange('PENDING_VERIFICATION')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'PENDING_VERIFICATION'
              ? 'border-primary text-primary bg-primary-light/30 rounded-t-md'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-border'
          }`}
        >
          <Clock className="w-4 h-4" />
          Menunggu Verifikasi
        </button>

        <button
          onClick={() => handleTabChange('VERIFIED')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'VERIFIED'
              ? 'border-primary text-primary bg-primary-light/30 rounded-t-md'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-border'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Perlu Penugasan
        </button>

        <button
          onClick={() => handleTabChange('ALL')}
          className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ALL'
              ? 'border-primary text-primary bg-primary-light/30 rounded-t-md'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-border'
          }`}
        >
          <List className="w-4 h-4" />
          Semua
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mb-6">
        <ReportFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Content View Rendering */}
      {viewMode === 'table' ? (
        <Card className="p-0 overflow-hidden">
          {error && (
            <Alert
              variant="error"
              className="m-4"
              action={
                <Button variant="danger" size="sm" onClick={handleRefresh}>
                  Coba Lagi
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {loadingTable ? (
            <div className="py-16 text-center text-ink-soft">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <p className="text-sm font-medium">Memuat antrean laporan...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-1">
                Tidak Ada Laporan Dalam Antrean
              </h3>
              <p className="text-ink-soft text-sm max-w-md mx-auto">
                Tidak ada pengaduan laporan yang sesuai dengan filter atau kriteria status saat ini.
              </p>
            </div>
          ) : (
            <div>
              <ReportList
                reports={reports}
                audience="staff"
                onOpen={(id) => navigate(`/verifier/reports/${id}`)}
              />

              <div className="px-4 py-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={(newPage) => setPage(newPage)}
                  disabled={loadingTable}
                />
              </div>
            </div>
          )}
        </Card>
      ) : (
        <ReportsMapPage
          reports={mapReports}
          totalItems={mapTotal}
          loading={loadingMap}
          onSelectReport={(id) => navigate(`/verifier/reports/${id}`)}
        />
      )}
    </DashboardLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Grid, Plus, RefreshCw, Users, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import type { TableResponseDto, TableStatus, OrderSummaryDto } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { signalRService } from '../services/signalr';

export const TablesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tables, setTables] = useState<TableResponseDto[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableResponseDto | null>(null);

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TableStatus>('Available');

  // Transfer Table Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTableId, setTargetTableId] = useState<number | ''>('');

  // Create Table Modal State (Manager)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createNumber, setCreateNumber] = useState('');
  const [createCapacity, setCreateCapacity] = useState('4');

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const url = filterStatus !== 'All' ? `/Tables?status=${filterStatus}` : '/Tables';
      const res = await api.get<TableResponseDto[]>(url);
      setTables(res.data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // SignalR Real-time Listener
    signalRService.startConnection().then(() => {
      signalRService.on('TableStatusChanged', () => {
        fetchTables();
      });
      signalRService.on('ReceiveOrderUpdate', () => {
        fetchTables();
      });
    });

    return () => {
      signalRService.off('TableStatusChanged');
      signalRService.off('ReceiveOrderUpdate');
    };
  }, [filterStatus]);

  const handleCreateDraftOrder = async (tableId: number) => {
    console.log('[Create Draft Order] Handler fired for tableId:', tableId);
    if (!tableId) return;

    try {
      // Check if active order already exists for this table
      const ordersRes = await api.get<OrderSummaryDto[]>('/Orders');
      const existing = ordersRes.data.find(
        (o) => o.tableId === tableId && o.status !== 'Completed' && o.status !== 'Cancelled' && o.status !== 'Voided'
      );

      if (existing) {
        console.log('[Create Draft Order] Active order already exists:', existing.id);
        setIsStatusModalOpen(false);
        navigate(`/orders?tableId=${tableId}`);
        return;
      }
    } catch (err) {
      console.error('[Create Draft Order] Check active order error:', err);
    }

    const payload = {
      tableId: Number(tableId),
      items: [],
    };
    console.log('[Create Draft Order] Sending POST /api/Orders with payload:', payload);

    try {
      const res = await api.post('/Orders', payload);
      console.log('[Create Draft Order] Order created successfully:', res.data);
      setIsStatusModalOpen(false);
      navigate(`/orders?tableId=${tableId}`);
    } catch (err: any) {
      console.error('[Create Draft Order] POST /api/Orders failed:', err?.response?.data || err?.message || err);
      setIsStatusModalOpen(false);
      navigate(`/orders?tableId=${tableId}`);
    }
  };

  const handleTableClick = (table: TableResponseDto) => {
    setSelectedTable(table);
    if (table.status === 'Occupied') {
      // Navigate to orders page with table pre-selected
      navigate(`/orders?tableId=${table.id}`);
    } else {
      // Open status modal
      setNewStatus(table.status);
      setIsStatusModalOpen(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTable) return;
    try {
      await api.put(`/Tables/${selectedTable.id}/status`, { status: newStatus });
      setIsStatusModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error('Failed to update table status:', err);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedTable || !targetTableId) return;
    try {
      await api.post('/Tables/transfer', {
        sourceTableId: selectedTable.id,
        targetTableId: Number(targetTableId),
      });
      setIsTransferModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error('Failed to transfer table:', err);
    }
  };

  // Edit Table Modal State (Manager)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNumber, setEditNumber] = useState('');
  const [editCapacity, setEditCapacity] = useState('4');

  const handleOpenEditTable = (table: TableResponseDto) => {
    setSelectedTable(table);
    setEditNumber(table.tableNumber.toString());
    setEditCapacity(table.capacity.toString());
    setIsEditModalOpen(true);
  };

  const handleUpdateTableStructure = async () => {
    if (!selectedTable || !editNumber || !editCapacity) return;
    try {
      await api.put(`/Tables/${selectedTable.id}`, {
        tableNumber: Number(editNumber),
        capacity: Number(editCapacity),
      });
      setIsEditModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error('Failed to update table structural details:', err);
    }
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/Tables/${tableId}`);
      setIsStatusModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error('Failed to delete table:', err);
    }
  };

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateTable = async () => {
    setCreateError(null);
    const num = Number(createNumber);
    const cap = Number(createCapacity);

    if (!num || num <= 0) {
      setCreateError('Please enter a valid table number greater than 0.');
      return;
    }
    if (!cap || cap <= 0) {
      setCreateError('Please enter a valid seat capacity greater than 0.');
      return;
    }

    try {
      await api.post('/Tables', {
        tableNumber: num,
        capacity: cap,
      });
      setIsCreateModalOpen(false);
      setCreateNumber('');
      setCreateCapacity('');
      setCreateError(null);
      fetchTables();
    } catch (err: any) {
      console.error('Failed to create table:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Failed to create table. Please check if table number already exists.';
      setCreateError(typeof msg === 'string' ? msg : 'Failed to create table.');
    }
  };

  const statuses: TableStatus[] = ['Available', 'Occupied', 'Reserved', 'Cleaning', 'OutOfService'];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-2 gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'All'
                ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                : 'bg-[var(--secondary-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
            }`}
          >
            {t('tables.all')} ({tables.length})
          </button>
          {statuses.map((st) => {
            const count = tables.filter((t) => t.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-[var(--fg-color)] text-[var(--bg-color)]'
                    : 'bg-[var(--secondary-bg)] text-[var(--muted-fg)] hover:text-[var(--fg-color)]'
                }`}
              >
                {t(`tables.${st.toLowerCase()}` as any) || st} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchTables} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>

          {user?.role === 'Manager' && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>{t('tables.addTable')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid of Tables */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-fg)]">
          {t('common.loading')}
        </div>
      ) : tables.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[var(--border-color)] rounded-xl">
          <Grid className="w-10 h-10 mx-auto text-[var(--muted-fg)] mb-2 opacity-50" />
          <p className="text-sm font-medium text-[var(--muted-fg)]">No tables found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              variant="interactive"
              onClick={() => handleTableClick(table)}
              className="flex flex-col justify-between h-40 p-4 border relative group overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold font-mono text-[var(--muted-fg)]">
                    #{table.tableNumber}
                  </span>
                  <Badge status={table.status}>
                    {t(`tables.${table.status.toLowerCase()}` as any) || table.status}
                  </Badge>
                </div>
                <h3 className="text-xl font-extrabold text-[var(--fg-color)] tracking-tight mt-1">
                  {t('tables.table')} {table.tableNumber}
                </h3>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-xs text-[var(--muted-fg)]">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{table.capacity} {t('tables.capacity')}</span>
                </div>
                {table.waiterName && (
                  <span className="truncate max-w-[80px] font-medium text-[var(--fg-color)]">
                    {table.waiterName}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`${t('tables.table')} ${selectedTable?.tableNumber} - ${t('tables.changeStatus')}`}
      >
        <div className="space-y-4">
          <Select
            label={t('tables.changeStatus')}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TableStatus)}
            options={statuses.map((s) => ({
              value: s,
              label: t(`tables.${s.toLowerCase()}` as any) || s,
            }))}
          />

          <div className="flex flex-wrap justify-between items-center pt-4 border-t border-[var(--border-color)] gap-2">
            <div className="flex space-x-2 gap-2">
              {selectedTable?.status === 'Occupied' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setIsTransferModalOpen(true);
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{t('tables.transferTable')}</span>
                </Button>
              )}

              {user?.role === 'Manager' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsStatusModalOpen(false);
                      if (selectedTable) handleOpenEditTable(selectedTable);
                    }}
                  >
                    Edit Table
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedTable?.status === 'Occupied'}
                    onClick={() => selectedTable && handleDeleteTable(selectedTable.id)}
                  >
                    Delete Table
                  </Button>
                </>
              )}
            </div>

            <div className="flex space-x-2 gap-2 ms-auto">
              {(user?.role === 'Waiter' || user?.role === 'Manager') && (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => {
                    if (selectedTable) {
                      handleCreateDraftOrder(selectedTable.id);
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('tables.newOrder')}</span>
                </Button>
              )}

              <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Table Structure Modal (Manager) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Table ${selectedTable?.tableNumber}`}
      >
        <div className="space-y-4">
          <Input
            label="Table Number"
            type="number"
            value={editNumber}
            onChange={(e) => setEditNumber(e.target.value)}
          />
          <Input
            label="Capacity (Seats)"
            type="number"
            value={editCapacity}
            onChange={(e) => setEditCapacity(e.target.value)}
          />
          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateTableStructure}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Table Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`${t('tables.transferTable')} (Table ${selectedTable?.tableNumber})`}
      >
        <div className="space-y-4">
          <Select
            label={t('tables.selectTableToTransfer')}
            value={targetTableId}
            onChange={(e) => setTargetTableId(Number(e.target.value))}
            options={[
              { value: '', label: '-- Select Table --' },
              ...tables
                .filter((t) => t.id !== selectedTable?.id && t.status === 'Available')
                .map((t) => ({
                  value: t.id,
                  label: `Table ${t.tableNumber} (${t.capacity} seats)`,
                })),
            ]}
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleTransferTable}>
              {t('tables.transfer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Table Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setCreateError(null);
          setIsCreateModalOpen(false);
        }}
        title={t('tables.addTable')}
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <Input
            label="Table Number"
            type="number"
            value={createNumber}
            onChange={(e) => setCreateNumber(e.target.value)}
            placeholder="e.g. 12"
          />
          <Input
            label="Capacity (Seats)"
            type="number"
            value={createCapacity}
            onChange={(e) => setCreateCapacity(e.target.value)}
            placeholder="e.g. 4"
          />
          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTable}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

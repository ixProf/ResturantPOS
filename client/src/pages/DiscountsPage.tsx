import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Edit2, CheckCircle2, XCircle, Trash2, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import type { DiscountResponseDto, CreateDiscountDto, DiscountType } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const DiscountsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isArabic = i18n.language === 'ar';

  const [discounts, setDiscounts] = useState<DiscountResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<DiscountType>('Percentage');
  const [value, setValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isApproved, setIsApproved] = useState<boolean>(true);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validTo, setValidTo] = useState<string>('');

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<DiscountResponseDto[]>('/Discounts');
      setDiscounts(res.data);
    } catch (err: any) {
      console.error('Failed to fetch discounts:', err);
      setError(err?.response?.data?.message || 'Failed to load discounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchDiscounts();
    }
  }, [isManager]);

  const handleOpenCreateModal = () => {
    setEditingDiscountId(null);
    setName('');
    setType('Percentage');
    setValue('');
    setReason('');
    setIsActive(true);
    setIsApproved(true);
    setValidFrom('');
    setValidTo('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: DiscountResponseDto) => {
    setEditingDiscountId(d.id);
    setName(d.name);
    setType(d.type);
    setValue(d.value.toString());
    setReason(d.reason);
    setIsActive(d.isActive);
    setIsApproved(d.isApproved);
    setValidFrom(d.validFrom ? d.validFrom.substring(0, 10) : '');
    setValidTo(d.validTo ? d.validTo.substring(0, 10) : '');
    setIsModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value || Number(value) <= 0 || !reason.trim()) return;

    try {
      const payload: CreateDiscountDto = {
        name: name.trim(),
        type,
        value: Number(value),
        reason: reason.trim(),
        isActive,
        isApproved,
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validTo: validTo ? new Date(validTo).toISOString() : undefined,
      };

      if (editingDiscountId) {
        await api.put(`/Discounts/${editingDiscountId}`, payload);
      } else {
        await api.post('/Discounts', payload);
      }

      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      console.error('Failed to save discount:', err);
      alert(err?.response?.data?.message || 'Error saving discount.');
    }
  };

  const handleToggleStatus = async (d: DiscountResponseDto) => {
    try {
      await api.put(`/Discounts/${d.id}/status`, {
        isActive: !d.isActive,
        isApproved: d.isApproved,
      });
      fetchDiscounts();
    } catch (err) {
      console.error('Failed to toggle discount status:', err);
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    if (!window.confirm(isArabic ? 'هل أنت تأكد من حذف هذا الخصم؟' : 'Are you sure you want to delete this discount?')) return;
    try {
      await api.delete(`/Discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      console.error('Failed to delete discount:', err);
    }
  };

  if (!isManager) {
    return (
      <div className="p-8 text-center bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--fg-color)]">
          {isArabic ? 'غير مصرح' : 'Access Restricted'}
        </h2>
        <p className="text-xs text-[var(--muted-fg)]">
          {isArabic ? 'إدارة الخصومات مقتصرة على مديري النظام فقط.' : 'Discount management is restricted to Managers only.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <Tag className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">
              {isArabic ? 'إدارة الخصومات العروض' : 'Discount & Promotion Management'}
            </h2>
            <p className="text-xs text-[var(--muted-fg)]">
              {isArabic ? 'إضافة وتعديل واعتماد الخصومات المتاحة للكاشير' : 'Create, edit, and approve cashier-eligible discounts'}
            </p>
          </div>
        </div>

        <Button variant="brand" size="sm" onClick={handleOpenCreateModal} className="gap-1.5 w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" />
          <span>{isArabic ? 'إضافة خصم جديد' : 'Create Discount'}</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[var(--muted-fg)]">
          {isArabic ? 'جاري التحميل...' : 'Loading discounts...'}
        </div>
      ) : discounts.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[var(--border-color)] rounded-xl text-xs text-[var(--muted-fg)]">
          {isArabic ? 'لا توجد خصومات مضافة حالياً.' : 'No discounts configured yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((d) => (
            <Card key={d.id} className="flex flex-col justify-between border space-y-3 p-4">
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <h3 className="font-bold text-base text-[var(--fg-color)] leading-snug">{d.name}</h3>
                    <p className="text-[11px] text-[var(--muted-fg)] font-mono">
                      {d.reason}
                    </p>
                  </div>
                  <Badge status={d.isActive ? 'Ready' : 'Cancelled'}>
                    {d.isActive ? (isArabic ? 'مفعل' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                  </Badge>
                </div>

                <div className="my-3 p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--border-color)] flex justify-between items-center">
                  <span className="text-xs text-[var(--muted-fg)]">{isArabic ? 'قيمة الخصم:' : 'Discount Value:'}</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {d.type === 'Percentage' ? `${d.value}%` : formatCurrency(d.value, i18n.language)}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-[var(--muted-fg)]">
                  <div className="flex justify-between">
                    <span>{isArabic ? 'النوع:' : 'Type:'}</span>
                    <span className="font-semibold text-[var(--fg-color)]">
                      {d.type === 'Percentage' ? (isArabic ? 'نسبة مئوية' : 'Percentage') : (isArabic ? 'مبلغ ثابت' : 'Fixed Amount')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? 'بواسطة:' : 'Created By:'}</span>
                    <span>{d.createdByName || 'Manager'}</span>
                  </div>
                  {(d.validFrom || d.validTo) && (
                    <div className="flex justify-between text-[10px] text-amber-400 pt-1">
                      <span>{isArabic ? 'الصلاحية:' : 'Validity:'}</span>
                      <span>
                        {d.validFrom ? formatDateTime(d.validFrom, i18n.language) : 'Any'} → {d.validTo ? formatDateTime(d.validTo, i18n.language) : 'Any'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(d)}
                  className={`text-xs gap-1 ${d.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                >
                  {d.isActive ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{d.isActive ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}</span>
                </Button>

                <div className="flex items-center space-x-1 gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(d)} className="p-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button variant="destructive" size="sm" onClick={() => handleDeleteDiscount(d.id)} className="p-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscountId ? (isArabic ? 'تعديل الخصم' : 'Edit Discount') : (isArabic ? 'إضافة خصم جديد' : 'Create New Discount')}
      >
        <form onSubmit={handleSaveDiscount} className="space-y-4 text-xs">
          <Input
            label={isArabic ? 'اسم الخصم' : 'Discount Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isArabic ? 'مثال: خصم الصيف 10%' : 'e.g. Summer Promo 10%'}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={isArabic ? 'نوع الخصم' : 'Discount Type'}
              value={type}
              onChange={(e) => setType(e.target.value as DiscountType)}
              options={[
                { value: 'Percentage', label: isArabic ? 'نسبة مئوية (%)' : 'Percentage (%)' },
                { value: 'FixedAmount', label: isArabic ? 'مبلغ ثابت (EGP)' : 'Fixed Amount (EGP)' },
              ]}
            />

            <Input
              label={type === 'Percentage' ? (isArabic ? 'النسبة المئوية (%)' : 'Percentage (%)') : (isArabic ? 'المبلغ (جنيه)' : 'Amount (EGP)')}
              type="number"
              step="0.01"
              min="0.01"
              max={type === 'Percentage' ? '100' : '100000'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'Percentage' ? '10' : '50'}
              required
            />
          </div>

          <Input
            label={isArabic ? 'سبب / وصف الخصم' : 'Reason / Description'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isArabic ? 'شرح كود أو سبب الخصم' : 'Reason for discount'}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isArabic ? 'صالح من (اختياري)' : 'Valid From (Optional)'}
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />

            <Input
              label={isArabic ? 'صالح حتى (اختياري)' : 'Valid To (Optional)'}
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="brand" size="sm">
              {editingDiscountId ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة الخصم' : 'Create Discount')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit, Trash2, Check, X, Search } from 'lucide-react';
import api from '../services/api';
import type { EmployeeDto, EmployeeRole } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

export const EmployeesPage: React.FC = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Waiter');

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<EmployeeDto[]>('/Employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('Waiter');
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeDto) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setEmail(emp.email);
    setPassword('');
    setPhone(emp.phone || '');
    setRole(emp.role);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!fullName || !email || (!editingEmployee && !password)) return;

    try {
      if (editingEmployee) {
        await api.put(`/Employees/${editingEmployee.id}`, {
          fullName,
          email,
          phone,
          role,
          isActive: editingEmployee.isActive,
        });
      } else {
        await api.post('/Employees', {
          fullName,
          email,
          password,
          phone,
          role,
        });
      }
      setIsEmployeeModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to save employee:', err);
    }
  };

  const handleToggleStatus = async (emp: EmployeeDto) => {
    try {
      await api.put(`/Employees/${emp.id}/status`, { isActive: !emp.isActive });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm(t('employees.deleteConfirm'))) return;
    try {
      await api.delete(`/Employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  };

  const rolesList: EmployeeRole[] = ['Manager', 'Waiter', 'Chef', 'Cashier', 'InventoryManager'];

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <Users className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">{t('employees.title')}</h2>
            <p className="text-xs text-[var(--muted-fg)]">{t('employees.subtitle')}</p>
          </div>
        </div>

        <Button variant="brand" size="sm" onClick={handleOpenAdd} className="w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" />
          <span>{t('employees.addEmployee')}</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
        <Search className="w-4 h-4 absolute start-3 top-3 text-[var(--muted-fg)]" />
      </div>

      {/* Employees Table */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-fg)]">
          {t('common.loading')}
        </div>
      ) : (
        <Card className="overflow-hidden p-0 border border-[var(--border-color)]">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 text-start">Full Name</th>
                  <th className="px-4 py-3 text-start">Email</th>
                  <th className="px-4 py-3 text-start">Phone</th>
                  <th className="px-4 py-3 text-start">Role</th>
                  <th className="px-4 py-3 text-start">Status</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[var(--secondary-bg)]/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">
                      {emp.fullName}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-fg)] font-mono">{emp.email}</td>
                    <td className="px-4 py-3 text-[var(--muted-fg)] font-mono">{emp.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge status="normal">{emp.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={emp.isActive ? 'Available' : 'OutOfService'}>
                        {emp.isActive ? t('employees.active') : t('employees.inactive')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-end space-x-1 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(emp)}
                        className="p-1.5"
                        title={t('employees.toggleStatus')}
                      >
                        {emp.isActive ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Employee Modal */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={editingEmployee ? t('employees.editEmployee') : t('employees.addEmployee')}
      >
        <div className="space-y-4">
          <Input
            label={t('employees.fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Staff"
          />
          <Input
            label={t('employees.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@alaris.com"
          />
          {!editingEmployee && (
            <Input
              label={t('employees.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          )}
          <Input
            label={t('employees.phone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01000000000"
          />
          <Select
            label={t('employees.role')}
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
            options={rolesList.map((r) => ({ value: r, label: r }))}
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsEmployeeModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEmployee}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

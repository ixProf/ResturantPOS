import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Boxes, Plus, AlertTriangle, ArrowUpDown, Search, Edit, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import type { IngredientDto, InventoryReasonType } from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatNumber } from '../utils/formatters';

export const InventoryPage: React.FC = () => {
  const { i18n } = useTranslation();
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<IngredientDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Ingredient Modal State
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientDto | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minimumStockLevel, setMinimumStockLevel] = useState('');

  // Stock Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | ''>('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<InventoryReasonType>('Restock');
  const [adjustReason, setAdjustReason] = useState('');

  // Inventory Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseIngredientId, setPurchaseIngredientId] = useState<number | ''>('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [purchaseReason, setPurchaseReason] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  const fetchInventory = async () => {
    try {
      const [ingRes, alertsRes] = await Promise.all([
        api.get<IngredientDto[]>('/Inventory/ingredients'),
        api.get<IngredientDto[]>('/Inventory/alerts/low-stock'),
      ]);
      setIngredients(ingRes.data);
      setLowStockAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSaveIngredient = async () => {
    if (!name || !unit || !minimumStockLevel) return;
    const payload = {
      name,
      quantity: quantity ? Number(quantity) : 0,
      unit,
      minimumStockLevel: Number(minimumStockLevel),
    };

    try {
      if (editingIngredient) {
        await api.put(`/Inventory/ingredients/${editingIngredient.id}`, payload);
      } else {
        await api.post('/Inventory/ingredients', payload);
      }
      setIsIngredientModalOpen(false);
      setEditingIngredient(null);
      resetIngredientForm();
      fetchInventory();
    } catch (err) {
      console.error('Failed to save ingredient:', err);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedIngredientId || !adjustQty) return;
    try {
      await api.post('/Inventory/stock/adjust', {
        ingredientId: Number(selectedIngredientId),
        quantity: Number(adjustQty),
        type: adjustType,
        reason: adjustReason,
      });
      setIsAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchInventory();
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const handleCreatePurchase = async () => {
    setPurchaseError('');
    if (!purchaseIngredientId) {
      setPurchaseError('Please select an ingredient.');
      return;
    }
    if (!purchaseQty || Number(purchaseQty) <= 0) {
      setPurchaseError('Quantity must be greater than zero.');
      return;
    }
    if (!purchaseUnitCost || Number(purchaseUnitCost) < 0) {
      setPurchaseError('Unit cost cannot be negative.');
      return;
    }
    if (!purchaseReason.trim()) {
      setPurchaseError('Please provide a reason or purchase detail.');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      await api.post('/Inventory/purchases', {
        ingredientId: Number(purchaseIngredientId),
        quantity: Number(purchaseQty),
        unitCost: Number(purchaseUnitCost),
        reason: purchaseReason.trim(),
      });

      setIsPurchaseModalOpen(false);
      resetPurchaseForm();
      fetchInventory();
    } catch (err: any) {
      console.error('Failed to create purchase:', err);
      setPurchaseError(err?.response?.data?.message || 'Failed to record purchase.');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const resetIngredientForm = () => {
    setName('');
    setQuantity('');
    setUnit('kg');
    setMinimumStockLevel('');
  };

  const resetPurchaseForm = () => {
    setPurchaseIngredientId('');
    setPurchaseQty('');
    setPurchaseUnitCost('');
    setPurchaseReason('');
    setPurchaseError('');
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculatedTotalPurchase =
    purchaseQty && purchaseUnitCost ? (Number(purchaseQty) * Number(purchaseUnitCost)).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)]">
            <Boxes className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">Inventory & Stock</h2>
            <p className="text-xs text-[var(--muted-fg)]">
              {ingredients.length} total raw ingredients • {lowStockAlerts.length} low stock warnings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:flex items-center space-x-2 gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(true)} className="justify-center">
            <ArrowUpDown className="w-4 h-4" />
            <span>Adjust Stock</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetPurchaseForm();
              setIsPurchaseModalOpen(true);
            }}
            className="border-emerald-600/40 text-emerald-400 hover:bg-emerald-950/30 justify-center"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Record Purchase / Expense</span>
          </Button>

          <Button
            variant="brand"
            size="sm"
            onClick={() => {
              setEditingIngredient(null);
              resetIngredientForm();
              setIsIngredientModalOpen(true);
            }}
            className="justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </Button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">Attention Required:</span> {lowStockAlerts.length}{' '}
              ingredient(s) are below minimum threshold levels (
              {lowStockAlerts.map((i) => i.name).join(', ')})
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdjustModalOpen(true)}
            className="border-amber-700/50 text-amber-200 hover:bg-amber-900/40 w-full sm:w-auto justify-center shrink-0"
          >
            Restock Now
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Input
          placeholder="Search ingredients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
        <Search className="w-4 h-4 absolute start-3 top-3 text-[var(--muted-fg)]" />
      </div>

      {/* Ingredients Table */}
      <Card className="overflow-hidden p-0 border border-[var(--border-color)]">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-start">Ingredient Name</th>
                <th className="px-4 py-3 text-start">Current Stock</th>
                <th className="px-4 py-3 text-start">Unit</th>
                <th className="px-4 py-3 text-start">Min Threshold</th>
                <th className="px-4 py-3 text-start">Stock Alert</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredIngredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-[var(--secondary-bg)]/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">{ing.name}</td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">
                    {formatNumber(ing.quantity || ing.totalStock, i18n.language)}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-fg)] uppercase font-mono">{ing.unit}</td>
                  <td className="px-4 py-3 text-[var(--muted-fg)] font-mono">
                    {formatNumber(ing.minimumStockLevel, i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={ing.isLowStock ? 'lowStock' : 'normal'}>
                      {ing.isLowStock ? 'Low Stock' : 'Normal'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-end space-x-1 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingIngredient(ing);
                        setName(ing.name);
                        setQuantity(ing.quantity.toString());
                        setUnit(ing.unit);
                        setMinimumStockLevel(ing.minimumStockLevel.toString());
                        setIsIngredientModalOpen(true);
                      }}
                      className="p-1.5"
                      title="Edit Ingredient"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIngredientId(ing.id);
                        setIsAdjustModalOpen(true);
                      }}
                      className="p-1.5"
                      title="Adjust Stock"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ingredient Add/Edit Modal */}
      <Modal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title={editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
      >
        <div className="space-y-4">
          <Input
            label="Ingredient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cheese, Tomato Sauce"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Unit of Measurement"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, g, l, pcs"
            />
          </div>
          <Input
            label="Minimum Stock Threshold"
            type="number"
            value={minimumStockLevel}
            onChange={(e) => setMinimumStockLevel(e.target.value)}
            placeholder="e.g. 5.0"
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsIngredientModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveIngredient}>
              Save Ingredient
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Ingredient Stock"
      >
        <div className="space-y-4">
          <Select
            label="Select Ingredient"
            value={selectedIngredientId}
            onChange={(e) => setSelectedIngredientId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: '-- Select Ingredient --' },
              ...ingredients.map((ing) => ({
                value: ing.id,
                label: `${ing.name} (Current: ${ing.quantity} ${ing.unit})`,
              })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity Delta / Amount"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 10 or -2"
            />
            <Select
              label="Adjustment Reason Type"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as InventoryReasonType)}
              options={[
                { value: 'Restock', label: 'Restock (+)' },
                { value: 'Waste', label: 'Waste (-)' },
                { value: 'Spoilage', label: 'Spoilage (-)' },
                { value: 'Order', label: 'Order Use (-)' },
                { value: 'Adjustment', label: 'Manual Adjustment' },
              ]}
            />
          </div>
          <Input
            label="Reason Details"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Optional audit log comment"
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdjustStock}>
              Apply Stock Adjustment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Purchase / Financial Expense Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Inventory Purchase / Expense"
      >
        <div className="space-y-4">
          {purchaseError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {purchaseError}
            </div>
          )}

          <Select
            label="Select Ingredient *"
            value={purchaseIngredientId}
            onChange={(e) => setPurchaseIngredientId(e.target.value ? Number(e.target.value) : '')}
            options={[
              { value: '', label: '-- Select Ingredient --' },
              ...ingredients.map((ing) => ({
                value: ing.id,
                label: `${ing.name} (Current Stock: ${ing.quantity || ing.totalStock} ${ing.unit})`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Quantity *"
              type="number"
              min="0.01"
              step="0.01"
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              placeholder="e.g. 20"
            />
            <Input
              label="Unit Cost (EGP) *"
              type="number"
              min="0"
              step="0.01"
              value={purchaseUnitCost}
              onChange={(e) => setPurchaseUnitCost(e.target.value)}
              placeholder="e.g. 100"
            />
          </div>

          <div className="p-3 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] flex justify-between items-center text-xs">
            <span className="text-[var(--muted-fg)]">Calculated Total Expense:</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {calculatedTotalPurchase} EGP
            </span>
          </div>

          <Input
            label="Purchase Reason / Description *"
            value={purchaseReason}
            onChange={(e) => setPurchaseReason(e.target.value)}
            placeholder="e.g. Fresh Chicken Purchase from Supplier"
          />

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleCreatePurchase}
              disabled={isSubmittingPurchase}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
            >
              {isSubmittingPurchase ? 'Recording...' : 'Save Purchase & Expense'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

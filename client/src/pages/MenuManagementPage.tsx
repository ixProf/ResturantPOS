import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Layers,
  Check,
  X,
  Search,
  Utensils,
} from 'lucide-react';
import api from '../services/api';
import type {
  CategoryDto,
  MenuItemDto,
  MenuItemDetailsDto,
  IngredientDto,
} from '../types/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { signalRService } from '../services/signalr';

export const MenuManagementPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

  // Category Manage Modal
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // MenuItem Add/Edit Modal
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDto | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState<number | ''>('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);

  // Recipe Modal
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<MenuItemDetailsDto | null>(null);
  const [addIngredientId, setAddIngredientId] = useState<number | ''>('');
  const [addQuantityUsed, setAddQuantityUsed] = useState('0.1');

  const canManageMenu = user?.role === 'Manager' || user?.role === 'Chef';

  const fetchIngredientsIfAllowed = async () => {
    if (canManageMenu || user?.role === 'InventoryManager') {
      try {
        const ingRes = await api.get<IngredientDto[]>('/MenuItems/ingredients');
        setAllIngredients(ingRes.data);
      } catch {
        try {
          const ingRes = await api.get<IngredientDto[]>('/Inventory/ingredients');
          setAllIngredients(ingRes.data);
        } catch (err) {
          console.error('Failed to load ingredients:', err);
        }
      }
    }
  };

  const fetchData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        api.get<CategoryDto[]>('/Categories'),
        api.get<MenuItemDto[]>('/MenuItems'),
      ]);
      setCategories(catRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    signalRService.startConnection().then(() => {
      signalRService.on('MenuUpdated', (data: any) => {
        console.log('[SignalR Event] MenuUpdated in MenuManagementPage:', data);
        fetchData();
      });
    });

    return () => {
      signalRService.off('MenuUpdated');
    };
  }, []);

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setIsCategoryManageOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDesc(cat.description || '');
    setIsCategoryManageOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    try {
      if (editingCategory) {
        await api.put(`/Categories/${editingCategory.id}`, {
          name: categoryName,
          description: categoryDesc,
        });
      } else {
        await api.post('/Categories', { name: categoryName, description: categoryDesc });
      }
      setIsCategoryManageOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/Categories/${catId}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Menu Item Actions
  const handleSaveMenuItem = async () => {
    if (!itemName || !itemPrice) return;
    const payload = {
      name: itemName,
      price: Number(itemPrice),
      categoryId: itemCategoryId ? Number(itemCategoryId) : null,
      description: itemDesc,
      isAvailable: itemAvailable,
    };

    try {
      if (editingItem) {
        await api.put(`/MenuItems/${editingItem.id}`, payload);
      } else {
        await api.post('/MenuItems', payload);
      }
      setIsMenuItemModalOpen(false);
      setEditingItem(null);
      resetMenuItemForm();
      fetchData();
    } catch (err) {
      console.error('Failed to save menu item:', err);
    }
  };

  const resetMenuItemForm = () => {
    setItemName('');
    setItemPrice('');
    setItemCategoryId('');
    setItemDesc('');
    setItemAvailable(true);
  };

  const handleOpenEdit = (item: MenuItemDto) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategoryId(item.categoryId || '');
    setItemDesc(item.description || '');
    setItemAvailable(item.isAvailable);
    setIsMenuItemModalOpen(true);
  };

  const handleToggleStatus = async (item: MenuItemDto) => {
    try {
      await api.put(`/MenuItems/${item.id}/status`, { isAvailable: !item.isAvailable });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/MenuItems/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  // Recipe Ingredient Actions
  const handleOpenRecipeModal = async (item: MenuItemDto) => {
    try {
      await fetchIngredientsIfAllowed();
      const res = await api.get<MenuItemDetailsDto>(`/MenuItems/${item.id}`);
      setSelectedItemDetails(res.data);
      setIsRecipeModalOpen(true);
    } catch (err) {
      console.error('Failed to load item recipe:', err);
    }
  };

  const handleAddIngredientToRecipe = async () => {
    if (!selectedItemDetails || !addIngredientId || !addQuantityUsed) return;
    try {
      await api.post(
        `/MenuItems/${selectedItemDetails.id}/ingredients?ingredientId=${addIngredientId}&quantityUsed=${addQuantityUsed}`
      );
      // Reload recipe details
      const res = await api.get<MenuItemDetailsDto>(`/MenuItems/${selectedItemDetails.id}`);
      setSelectedItemDetails(res.data);
      setAddIngredientId('');
      setAddQuantityUsed('0.1');
    } catch (err) {
      console.error('Failed to add ingredient to recipe:', err);
    }
  };

  const handleRemoveIngredientFromRecipe = async (ingredientId: number) => {
    if (!selectedItemDetails) return;
    try {
      await api.delete(`/MenuItems/${selectedItemDetails.id}/ingredients/${ingredientId}`);
      const res = await api.get<MenuItemDetailsDto>(`/MenuItems/${selectedItemDetails.id}`);
      setSelectedItemDetails(res.data);
    } catch (err) {
      console.error('Failed to remove ingredient from recipe:', err);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center space-x-3 gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] shrink-0">
            <BookOpen className="w-5 h-5 text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--fg-color)]">Menu & Categories</h2>
            <p className="text-xs text-[var(--muted-fg)]">
              {menuItems.length} items across {categories.length} categories
            </p>
          </div>
        </div>

        {canManageMenu && (
          <div className="flex items-center space-x-2 gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleOpenAddCategory} className="flex-1 sm:flex-initial justify-center">
              <Layers className="w-4 h-4" />
              <span>Add Category</span>
            </Button>

            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                resetMenuItemForm();
                setIsMenuItemModalOpen(true);
              }}
              className="flex-1 sm:flex-initial justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Menu Item</span>
            </Button>
          </div>
        )}
      </div>

      {/* Category Pills & CRUD Bar */}
      <div className="flex items-center gap-2 bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border-color)] overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-[var(--muted-fg)] uppercase tracking-wider me-2 shrink-0">
          Categories:
        </span>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center space-x-1 gap-1 px-2.5 py-1 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] text-xs text-[var(--fg-color)]"
          >
            <span className="font-medium">{cat.name}</span>
            {canManageMenu && (
              <>
                <button
                  onClick={() => handleOpenEditCategory(cat)}
                  className="p-1 text-[var(--muted-fg)] hover:text-[var(--fg-color)]"
                  title="Edit Category"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 text-[var(--muted-fg)] hover:text-rose-400"
                  title="Delete Category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
          <Search className="w-4 h-4 absolute start-3 top-3 text-[var(--muted-fg)]" />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Menu Items Table */}
      <Card className="overflow-hidden p-0 border border-[var(--border-color)]">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[var(--sidebar-bg)] border-b border-[var(--border-color)] text-[var(--muted-fg)] uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 text-start">Name</th>
                <th className="px-4 py-3 text-start">Category</th>
                <th className="px-4 py-3 text-start">Price</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--secondary-bg)]/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[var(--fg-color)]">
                    {item.name}
                    {item.description && (
                      <p className="text-[11px] text-[var(--muted-fg)] font-normal truncate max-w-xs">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-fg)] font-medium">
                    {item.categoryName || 'General'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--fg-color)]">
                    {formatCurrency(item.price, i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={item.isAvailable ? 'Available' : 'OutOfService'}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-end space-x-1 gap-1">
                    {canManageMenu && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRecipeModal(item)}
                        className="p-1.5"
                        title="Manage Recipe Ingredients"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(item)}
                      className="p-1.5"
                      title="Toggle Stock / Availability"
                    >
                      {item.isAvailable ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </Button>
                    {canManageMenu && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category Modal (Create / Edit) */}
      <Modal
        isOpen={isCategoryManageOpen}
        onClose={() => setIsCategoryManageOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Appetizers, Beverages"
          />
          <Input
            label="Description"
            value={categoryDesc}
            onChange={(e) => setCategoryDesc(e.target.value)}
            placeholder="Optional description"
          />
          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryManageOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCategory}>
              Save Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Menu Item Modal (Create / Edit) */}
      <Modal
        isOpen={isMenuItemModalOpen}
        onClose={() => setIsMenuItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Grilled Chicken Burger"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price"
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Category"
              value={itemCategoryId}
              onChange={(e) => setItemCategoryId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: '-- None --' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Input
            label="Description"
            value={itemDesc}
            onChange={(e) => setItemDesc(e.target.value)}
            placeholder="Brief item description"
          />
          <div className="flex items-center space-x-2 gap-2 pt-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={itemAvailable}
              onChange={(e) => setItemAvailable(e.target.checked)}
              className="rounded bg-[var(--card-bg)] border-[var(--border-color)]"
            />
            <label htmlFor="isAvailable" className="text-xs font-medium text-[var(--fg-color)]">
              Item Available for Order
            </label>
          </div>

          <div className="flex justify-end space-x-2 gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" size="sm" onClick={() => setIsMenuItemModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveMenuItem}>
              Save Menu Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recipe Management Modal */}
      <Modal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        title={`Recipe Ingredients - ${selectedItemDetails?.name}`}
      >
        <div className="space-y-4">
          {/* Current Recipe Ingredients List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-fg)]">
              Linked Ingredients
            </h4>
            {selectedItemDetails?.ingredients && selectedItemDetails.ingredients.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                {selectedItemDetails.ingredients.map((ing) => (
                  <div
                    key={ing.ingredientId}
                    className="p-2.5 flex items-center justify-between bg-[var(--card-bg)] text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[var(--fg-color)]">
                        {ing.ingredientName}
                      </span>
                      <span className="text-[var(--muted-fg)] ms-2 font-mono">
                        ({ing.quantityUsed} {ing.unit})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddIngredientId(ing.ingredientId);
                          setAddQuantityUsed(ing.quantityUsed.toString());
                        }}
                        className="p-1 text-[var(--muted-fg)] hover:text-[var(--fg-color)]"
                        title="Edit Quantity"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredientFromRecipe(ing.ingredientId)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                        title="Remove Ingredient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted-fg)] italic">
                No raw ingredients linked to this menu item recipe yet.
              </p>
            )}
          </div>

          {/* Add Ingredient to Recipe Form */}
          <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-fg)]">
              Add Ingredient to Recipe
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Ingredient"
                value={addIngredientId}
                onChange={(e) => setAddIngredientId(Number(e.target.value))}
                options={[
                  { value: '', label: '-- Select Ingredient --' },
                  ...allIngredients.map((ing) => ({
                    value: ing.id,
                    label: `${ing.name} (${ing.unit})`,
                  })),
                ]}
              />
              <Input
                label="Quantity Used per Order"
                type="number"
                step="0.01"
                value={addQuantityUsed}
                onChange={(e) => setAddQuantityUsed(e.target.value)}
                placeholder="e.g. 0.25"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddIngredientToRecipe}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              <span>Link Ingredient to Recipe</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

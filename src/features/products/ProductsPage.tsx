import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Download,
  Upload,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storageService } from '../../services/storageService';
import { Product, ProductCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { DataTable, Column } from '../../components/common/DataTable';
import { formatINR } from '../../utils/currency';
import { exportToCSV, downloadProductTemplateCSV, parseCSVFile } from '../../utils/csvHelper';
import { useNotification } from '../../context/NotificationContext';

export const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeBusinessId } = useBusiness();
  const { showToast } = useNotification();

  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts(activeBusinessId));
  const [categories, setCategories] = useState<ProductCategory[]>(() => storageService.getCategories(activeBusinessId));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    hsn_code: '',
    category_id: '',
    unit: 'PCS',
    selling_price: 0,
    purchase_price: 0,
    gst_rate: 18,
    tax_type: 'exclusive',
    cess_rate: 0,
    opening_stock: 0,
    current_stock: 0,
    low_stock_threshold: 5,
    description: '',
    barcode: '',
  });

  const reloadData = () => {
    setProducts(storageService.getProducts(activeBusinessId));
    setCategories(storageService.getCategories(activeBusinessId));
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter((p) => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      hsn_code: '',
      category_id: categories[0]?.id || '',
      unit: 'PCS',
      selling_price: 0,
      purchase_price: 0,
      gst_rate: 18,
      tax_type: 'exclusive',
      cess_rate: 0,
      opening_stock: 0,
      current_stock: 0,
      low_stock_threshold: 5,
      description: '',
      barcode: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData(prod);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const cat = categories.find((c) => c.id === formData.category_id);

    const saved = storageService.saveProduct({
      ...(formData as Product),
      id: editingProduct?.id || crypto.randomUUID(),
      business_id: activeBusinessId,
      name: formData.name.trim(),
      category_name: cat?.name || '',
      selling_price: Number(formData.selling_price || 0),
      purchase_price: Number(formData.purchase_price || 0),
      gst_rate: Number(formData.gst_rate || 18),
      opening_stock: Number(formData.opening_stock || 0),
      current_stock: editingProduct ? editingProduct.current_stock : Number(formData.opening_stock || 0),
      low_stock_threshold: Number(formData.low_stock_threshold || 5),
      is_active: true,
      created_at: editingProduct?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    showToast({
      type: 'success',
      title: editingProduct ? 'Item Updated' : 'Item Added',
      message: `${saved.name} saved successfully.`,
    });

    setIsModalOpen(false);
    reloadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      storageService.deleteProduct(id);
      showToast({ type: 'info', title: 'Product Deleted', message: `${name} has been archived.` });
      reloadData();
    }
  };

  const handleExportCSV = () => {
    exportToCSV('products_catalog_export', filteredProducts);
    showToast({ type: 'success', title: 'Export Complete', message: 'Products exported to CSV.' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows: any[] = await parseCSVFile(file);
      let count = 0;
      rows.forEach((r) => {
        if (r.Name) {
          storageService.saveProduct({
            id: crypto.randomUUID(),
            business_id: activeBusinessId,
            name: String(r.Name).trim(),
            sku: r.SKU ? String(r.SKU) : '',
            hsn_code: r.HSN ? String(r.HSN) : '',
            unit: r.Unit || 'PCS',
            selling_price: Number(r.SellingPrice || 0),
            purchase_price: Number(r.PurchasePrice || 0),
            gst_rate: Number(r.GSTRate || 18),
            tax_type: 'exclusive',
            cess_rate: 0,
            opening_stock: Number(r.OpeningStock || 0),
            current_stock: Number(r.OpeningStock || 0),
            low_stock_threshold: Number(r.LowStockThreshold || 5),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          count++;
        }
      });
      showToast({ type: 'success', title: 'Import Complete', message: `Imported ${count} products.` });
      reloadData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Import Failed', message: err.message });
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product / Service Name',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            {p.sku && <span>SKU: {p.sku}</span>}
            {p.hsn_code && <span>• HSN: {p.hsn_code}</span>}
            {p.category_name && <span>• {p.category_name}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(p.selling_price)}
          </span>
          <span className="text-[10px] text-slate-400 block">per {p.unit}</span>
        </div>
      ),
    },
    {
      key: 'purchase_price',
      header: 'Purchase Price',
      render: (p) => (
        <span className="font-mono text-slate-600 dark:text-slate-400">
          {formatINR(p.purchase_price)}
        </span>
      ),
    },
    {
      key: 'gst_rate',
      header: 'GST Rate',
      render: (p) => (
        <Badge size="sm" variant="info">
          {p.gst_rate}% GST
        </Badge>
      ),
    },
    {
      key: 'current_stock',
      header: 'Current Stock',
      sortable: true,
      render: (p) => {
        const isLow = Number(p.current_stock) <= Number(p.low_stock_threshold);
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-semibold ${isLow ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {p.current_stock} {p.unit}
            </span>
            {isLow && (
              <Badge variant="danger" size="sm">
                Low
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(p)}
            className="p-1.5 h-7 text-slate-600"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(p.id, p.name)}
            className="p-1.5 h-7 text-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-100">
            Products & Items
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your inventory catalog, HSN/SAC codes, selling rates, and GST taxes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </span>
          </label>

          <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>

          <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {c.name} ({products.filter((p) => p.category_id === c.id).length})
            </button>
          ))}
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchPlaceholder="Search by item name, SKU, HSN..."
        searchKeys={['name', 'sku', 'hsn_code', 'description']}
        emptyTitle="No products in catalog"
        emptyDescription="Add your items to auto-populate prices and GST during invoice creation."
        emptyAction={
          <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add First Product
          </Button>
        }
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description="Enter product details, pricing, tax rate and initial stock level."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g. Samsung Galaxy S24 Ultra"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="SKU / Item Code"
              placeholder="e.g. SAM-S24U-256"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
            <Input
              label="HSN / SAC Code"
              placeholder="e.g. 85171200"
              value={formData.hsn_code}
              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
            />
            <Select
              label="Unit of Measure"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: 'PCS', label: 'PCS (Pieces)' },
                { value: 'BOX', label: 'BOX (Boxes)' },
                { value: 'KG', label: 'KG (Kilograms)' },
                { value: 'MTR', label: 'MTR (Meters)' },
                { value: 'LTR', label: 'LTR (Liters)' },
                { value: 'PKT', label: 'PKT (Packets)' },
                { value: 'SET', label: 'SET (Sets)' },
                { value: 'SQFT', label: 'SQFT (Square Feet)' },
                { value: 'NOS', label: 'NOS (Numbers)' },
                { value: 'HRS', label: 'HRS (Hours)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Selling Price (₹)"
              type="number"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
              required
            />
            <Input
              label="Purchase Price (₹)"
              type="number"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
            />
            <Select
              label="GST Tax Rate"
              value={formData.gst_rate}
              onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
              options={[
                { value: 0, label: '0% (Exempt)' },
                { value: 5, label: '5% GST' },
                { value: 12, label: '12% GST' },
                { value: 18, label: '18% GST' },
                { value: 28, label: '28% GST' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Opening / Current Stock"
              type="number"
              value={formData.opening_stock}
              onChange={(e) => setFormData({ ...formData, opening_stock: Number(e.target.value) })}
              disabled={!!editingProduct}
            />
            <Input
              label="Low Stock Warning Threshold"
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Description / Specs (Optional)"
            placeholder="e.g. Titanium Gray, 12GB RAM, 256GB Storage"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={downloadProductTemplateCSV}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Download Sample Product CSV
            </button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

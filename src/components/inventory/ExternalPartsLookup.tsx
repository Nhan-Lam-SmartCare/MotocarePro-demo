import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Download, Plus, RefreshCw, Upload, LayoutGrid, List, Copy, Check, Tag } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ExternalPart } from '../../types';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-toastify';
import { ExternalDataImport } from './ExternalDataImport';

const ImageWithFallback = ({ src, alt, sku }: { src: string; alt: string; sku: string }) => {
    const [imgState, setImgState] = useState<'primary' | 'secondary' | 'error'>('primary');

    const primarySrc = src || (sku ? `https://panel.dov.vn/storage/parts-images/u2/${sku}.webp` : '');
    const secondarySrc = sku ? `https://panel.dov.vn/storage/parts-images/u2/${sku}.webp` : '';

    if (imgState === 'error' || (!primarySrc && !secondarySrc)) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/60 rounded-lg p-2 text-slate-400 dark:text-slate-500">
                <Tag className="w-8 h-8 mb-1 opacity-30" />
                <span className="text-[10px] font-medium text-slate-400">Hình ảnh Hãng</span>
            </div>
        );
    }

    return (
        <img
            src={imgState === 'primary' ? primarySrc : secondarySrc}
            alt={alt}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => {
                if (imgState === 'primary' && secondarySrc && primarySrc !== secondarySrc) {
                    setImgState('secondary');
                } else {
                    setImgState('error');
                }
            }}
        />
    );
};

export default function ExternalPartsLookup() {
    const [parts, setParts] = useState<ExternalPart[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showImportModal, setShowImportModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [copiedSku, setCopiedSku] = useState<string | null>(null);
    const ITEMS_PER_PAGE = 24;

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_external_part_categories');

            if (error) throw error;
            const uniqueCategories = data?.map((item: any) => item.category) || [];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            try {
                const { data } = await supabase
                    .from('external_parts')
                    .select('category')
                    .range(0, 999);
                const uniqueCategories = Array.from(new Set(data?.map(item => item.category).filter(Boolean) || [])).sort();
                setCategories(uniqueCategories);
            } catch (e) {
                console.error('Fallback fetch failed:', e);
            }
        }
    };

    const fetchParts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('external_parts')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
            }

            if (selectedCategory) {
                query = query.eq('category', selectedCategory);
            }

            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await query
                .range(from, to)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setParts(data || []);
            if (count !== null && count !== undefined) {
                setTotalCount(count);
                setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
            }
        } catch (error) {
            console.error('Error fetching external parts:', error);
            toast.error('Không thể tải dữ liệu phụ tùng ngoài');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchParts();
    }, [page, searchTerm, selectedCategory]);

    const handleCopySku = (sku: string) => {
        if (!sku) return;
        navigator.clipboard.writeText(sku);
        setCopiedSku(sku);
        toast.success(`Đã sao chép mã SKU: ${sku}`);
        setTimeout(() => setCopiedSku(null), 2000);
    };

    const handleAddToInventory = (part: ExternalPart) => {
        toast.info(`Đã chọn: ${part.name} (Mã: ${part.sku || 'N/A'}).`);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 sm:py-4">
                {/* Desktop Header */}
                <div className="hidden sm:flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Tra cứu phụ tùng ngoài</span>
                            {totalCount > 0 && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    {totalCount.toLocaleString('vi-VN')} phụ tùng
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Tra cứu giá, hình ảnh và mã SKU phụ tùng từ nguồn dữ liệu catalog bên ngoài
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* View Switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Xem dạng Thẻ Hình Ảnh (Dạng DOV Catalog)"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span>Thẻ hình ảnh</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Xem dạng Bảng Danh Sách"
                            >
                                <List className="w-4 h-4" />
                                <span>Bảng danh sách</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Nhập dữ liệu CSV</span>
                        </button>
                        <button
                            onClick={() => {
                                fetchParts();
                                fetchCategories();
                            }}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Làm mới"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="sm:hidden flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tra cứu ngoài</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">DOV / Honda Catalog</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 active:bg-blue-700"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Nhập CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="p-4 sm:p-6 sm:pb-0">
                {/* Desktop Filter */}
                <div className="hidden sm:flex flex-col md:flex-row gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên phụ tùng hoặc mã SKU (Ví dụ: 53166, Tay nắm...)..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm w-full md:w-64">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            <option value="">-- Tất cả danh mục --</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mobile Filter */}
                <div className="sm:hidden space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc SKU..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-no-repeat bg-right pr-10"
                    >
                        <option value="">-- Tất cả danh mục --</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-auto flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                        <RefreshCw className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Đang tải dữ liệu phụ tùng...</p>
                    </div>
                ) : parts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                        <Search className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Chưa có phụ tùng ngoài nào</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md text-center">
                            Hãy bấm nút <span className="font-semibold text-blue-600 dark:text-blue-400">"Nhập dữ liệu CSV"</span> ở phía trên để tải file danh mục phụ tùng DOV / Honda vào hệ thống.
                        </p>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Tải file CSV ngay</span>
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* DOV-style Grid View */
                    <div className="flex-1 flex flex-col justify-between space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {parts.map((part) => (
                                <div
                                    key={part.id}
                                    className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden relative"
                                >
                                    {/* Product Image Box */}
                                    <div className="aspect-square bg-slate-50 dark:bg-slate-900/60 p-3 relative flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-700/50">
                                        <ImageWithFallback src={part.image_url || ''} alt={part.name} sku={part.sku || ''} />
                                    </div>

                                    {/* Product Info Card Body */}
                                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                        <div>
                                            {/* SKU Code Pill with Copy Action */}
                                            {part.sku && (
                                                <div
                                                    onClick={() => handleCopySku(part.sku!)}
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-mono text-[11px] font-bold rounded border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-colors mb-1.5"
                                                    title="Bấm để sao chép mã SKU"
                                                >
                                                    <span>{part.sku}</span>
                                                    {copiedSku === part.sku ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Product Title */}
                                            <h3
                                                className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                title={part.name}
                                            >
                                                {part.name}
                                            </h3>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-1.5">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Giá tham khảo</span>
                                                <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(part.price)}
                                                </span>
                                            </div>

                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleAddToInventory(part)}
                                                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>Báo giá / Chọn</span>
                                                </button>
                                                {part.source_url && (
                                                    <a
                                                        href={part.source_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                                        title="Xem trang gốc"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Bar */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Trang <span className="text-blue-600 dark:text-blue-400 font-bold">{page}</span> / {totalPages} • {totalCount.toLocaleString('vi-VN')} phụ tùng
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600"
                                >
                                    ← Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600"
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">Hình ảnh</th>
                                        <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">Mã SKU</th>
                                        <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">Tên phụ tùng</th>
                                        <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">Giá tham khảo</th>
                                        <th className="px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {parts.map((part) => (
                                        <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                            <td className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                                                <div className="w-12 h-12 relative overflow-hidden rounded border border-slate-200 dark:border-slate-700 bg-white p-0.5">
                                                    <ImageWithFallback src={part.image_url || ''} alt={part.name} sku={part.sku || ''} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">
                                                {part.sku || '---'}
                                            </td>
                                            <td className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
                                                <div className="font-medium text-slate-900 dark:text-slate-100">{part.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{part.category}</div>
                                            </td>
                                            <td className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 font-extrabold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(part.price)}
                                            </td>
                                            <td className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {part.sku && (
                                                        <button
                                                            onClick={() => handleCopySku(part.sku!)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Sao chép SKU"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleAddToInventory(part)}
                                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                        title="Chọn"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Trang {page} / {totalPages} • {totalCount.toLocaleString('vi-VN')} phụ tùng
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Import CSV Modal */}
            {showImportModal && (
                <ExternalDataImport
                    onClose={() => setShowImportModal(false)}
                    onImported={() => {
                        fetchParts();
                        fetchCategories();
                    }}
                />
            )}
        </div>
    );
}


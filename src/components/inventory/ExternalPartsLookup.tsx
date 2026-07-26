import React, { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Plus, RefreshCw, Upload, LayoutGrid, List, Copy, Check, Tag, Folder, Layers, X, TrendingUp, Filter, ChevronRight, ChevronDown } from 'lucide-react';
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
    const [categorySearch, setCategorySearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
        model_honda: true,
        system_parts: true,
        other: true,
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showImportModal, setShowImportModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [copiedSku, setCopiedSku] = useState<string | null>(null);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
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

    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categories;
        return categories.filter(cat =>
            cat.toLowerCase().includes(categorySearch.toLowerCase().trim())
        );
    }, [categories, categorySearch]);

    // Phân nhóm danh mục thành Thư Mục Cha & Thư Mục Con
    const groupedCategories = useMemo(() => {
        const list = filteredCategories;
        const modelHonda: string[] = [];
        const systemParts: string[] = [];
        const other: string[] = [];

        list.forEach((cat) => {
            const upper = cat.toUpperCase();
            if (
                upper.startsWith('PHỤ TÙNG ') ||
                upper.includes('WAVE') ||
                upper.includes('AIR BLADE') ||
                upper.includes('SH ') ||
                upper.includes('VISION') ||
                upper.includes('LEAD') ||
                upper.includes('FUTURE') ||
                upper.includes('WINNER') ||
                upper.includes('DREAM') ||
                upper.includes('VARIO') ||
                upper.includes('PCX') ||
                upper.includes('CUB') ||
                upper.includes('EXCITER') ||
                upper.includes('SIRIUS') ||
                upper.includes('JANUS') ||
                upper.includes('NVX') ||
                upper.includes('RAIDER') ||
                upper.includes('SATRIA')
            ) {
                modelHonda.push(cat);
            } else if (
                upper.includes('HỆ THỐNG') ||
                upper.includes('BỘ KHOÁ') ||
                upper.includes('CHẾ HOÀ KHÍ') ||
                upper.includes('DẦU NHỚT') ||
                upper.includes('ĐỒNG HỒ') ||
                upper.includes('GIẢM XÓC') ||
                upper.includes('GƯƠNG') ||
                upper.includes('PHANH') ||
                upper.includes('NHÔNG XÍCH') ||
                upper.includes('LÓC MÁY') ||
                upper.includes('NHỰA XE') ||
                upper.includes('KHUNG XE') ||
                upper.includes('PHỚT') ||
                upper.includes('LY HỢP') ||
                upper.includes('CÔN') ||
                upper.includes('BƠM DẦU') ||
                upper.includes('BƠM XĂNG') ||
                upper.includes('LỌC GIÓ') ||
                upper.includes('ĐÈN') ||
                upper.includes('PÔ') ||
                upper.includes('PHÁT ĐIỆN')
            ) {
                systemParts.push(cat);
            } else {
                other.push(cat);
            }
        });

        return {
            modelHonda,
            systemParts,
            other,
        };
    }, [filteredCategories]);

    const handleCopySku = (sku: string) => {
        if (!sku) return;
        navigator.clipboard.writeText(sku);
        setCopiedSku(sku);
        toast.success(`Đã sao chép mã SKU: ${sku}`);
        setTimeout(() => setCopiedSku(null), 2000);
    };

    const handleAddToInventory = (part: ExternalPart) => {
        const sellingPrice = part.price * 1.4;
        toast.info(
            `Đã chọn: ${part.name} (SKU: ${part.sku || 'N/A'}). Giá bán báo khách: ${formatCurrency(sellingPrice)}`
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Top Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                            <span>Tra cứu phụ tùng ngoài</span>
                            {totalCount > 0 && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    {totalCount.toLocaleString('vi-VN')} phụ tùng
                                </span>
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Tra cứu giá nhập, tự động tính giá bán (+40%) báo khách & sao chép SKU phụ tùng
                        </p>
                    </div>

                    <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
                        {/* View Switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Xem dạng Thẻ Hình Ảnh"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="hidden sm:inline">Thẻ hình ảnh</span>
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
                                <span className="hidden sm:inline">Bảng danh sách</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Nhập CSV</span>
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
            </div>

            {/* Main Content Area with Left Sidebar & Right Grid/Table */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Category Sidebar (Desktop) */}
                <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span>Danh mục phụ tùng</span>
                            </div>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {categories.length}
                            </span>
                        </div>

                        {/* Quick search inside category list */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Tìm nhanh danh mục..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {categorySearch && (
                                <button
                                    onClick={() => setCategorySearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category List - Parent & Child Groups */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {/* All categories option */}
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setPage(1);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                selectedCategory === ''
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Folder className={`w-4 h-4 ${selectedCategory === '' ? 'text-white' : 'text-blue-500'}`} />
                                <span>Tất cả phụ tùng ngoài</span>
                            </div>
                            {selectedCategory === '' && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                        </button>

                        {/* Thư Mục Cha 1: MODEL XE HONDA */}
                        {groupedCategories.modelHonda.length > 0 && (
                            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden">
                                <button
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, model_honda: !prev.model_honda }))}
                                    className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-100/80 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors border-b border-slate-200/60 dark:border-slate-700/50 text-xs font-extrabold text-slate-800 dark:text-slate-100"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <ChevronDown className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${expandedGroups.model_honda ? '' : '-rotate-90'}`} />
                                        <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider">MODEL XE HONDA</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                        {groupedCategories.modelHonda.length} dòng xe
                                    </span>
                                </button>

                                {expandedGroups.model_honda && (
                                    <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                                        {groupedCategories.modelHonda.map((cat) => {
                                            const isSelected = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setPage(1);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span className="truncate pl-1">{cat}</span>
                                                    {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Thư Mục Cha 2: HỆ THỐNG & LINH KIỆN */}
                        {groupedCategories.systemParts.length > 0 && (
                            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden">
                                <button
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, system_parts: !prev.system_parts }))}
                                    className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-100/80 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors border-b border-slate-200/60 dark:border-slate-700/50 text-xs font-extrabold text-slate-800 dark:text-slate-100"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <ChevronDown className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${expandedGroups.system_parts ? '' : '-rotate-90'}`} />
                                        <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">HỆ THỐNG & LINH KIỆN</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                                        {groupedCategories.systemParts.length} nhóm
                                    </span>
                                </button>

                                {expandedGroups.system_parts && (
                                    <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                                        {groupedCategories.systemParts.map((cat) => {
                                            const isSelected = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setPage(1);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span className="truncate pl-1">{cat}</span>
                                                    {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Thư Mục Cha 3: DANH MỤC KHÁC */}
                        {groupedCategories.other.length > 0 && (
                            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden">
                                <button
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, other: !prev.other }))}
                                    className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-100/80 dark:bg-slate-700/60 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors border-b border-slate-200/60 dark:border-slate-700/50 text-xs font-extrabold text-slate-800 dark:text-slate-100"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <ChevronDown className={`w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${expandedGroups.other ? '' : '-rotate-90'}`} />
                                        <span className="text-purple-600 dark:text-purple-400 uppercase tracking-wider">DANH MỤC KHÁC</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                        {groupedCategories.other.length}
                                    </span>
                                </button>

                                {expandedGroups.other && (
                                    <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                                        {groupedCategories.other.map((cat) => {
                                            const isSelected = selectedCategory === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setPage(1);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span className="truncate pl-1">{cat}</span>
                                                    {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Mobile Category Bar */}
                <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold w-full justify-between"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Filter className="w-3.5 h-3.5 text-blue-600" />
                                <span className="truncate">Danh mục: <strong className="text-blue-600 dark:text-blue-400">{selectedCategory || 'Tất cả danh mục'}</strong></span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transform transition-transform ${isMobileCategoryOpen ? 'rotate-90' : ''}`} />
                        </button>
                    </div>

                    {isMobileCategoryOpen && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto space-y-1">
                            <button
                                onClick={() => {
                                    setSelectedCategory('');
                                    setPage(1);
                                    setIsMobileCategoryOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                                    selectedCategory === '' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                Tất cả danh mục
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setPage(1);
                                        setIsMobileCategoryOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs ${
                                        selectedCategory === cat ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                    {/* Search Bar & Active Category Filter Tag */}
                    <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên phụ tùng hoặc mã SKU (Ví dụ: 53166, Tay nắm...)..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Active Category Tag if selected */}
                        {selectedCategory && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0">
                                <span>Danh mục: <strong>{selectedCategory}</strong></span>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setPage(1);
                                    }}
                                    className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                                    title="Bỏ chọn danh mục"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Product Cards Grid / Table Container */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
                                <RefreshCw className="w-10 h-10 animate-spin mb-3 text-blue-500" />
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Đang tải dữ liệu phụ tùng...</p>
                            </div>
                        ) : parts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                                <Search className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy phụ tùng phù hợp</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md text-center">
                                    {searchTerm || selectedCategory
                                        ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'
                                        : 'Hãy bấm nút "Nhập CSV" ở phía trên để tải file danh mục phụ tùng DOV / Honda vào hệ thống.'}
                                </p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* DOV-style Grid View with Dual Prices */
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                {parts.map((part) => {
                                    const sellingPrice = part.price * 1.4;
                                    return (
                                        <div
                                            key={part.id}
                                            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden relative"
                                        >
                                            {/* Product Image Box */}
                                            <div className="aspect-square bg-slate-50 dark:bg-slate-900/60 p-3 relative flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-700/50">
                                                <ImageWithFallback src={part.image_url || ''} alt={part.name} sku={part.sku || ''} />
                                            </div>

                                            {/* Product Info Card Body */}
                                            <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
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
                                                        className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
                                                        title={part.name}
                                                    >
                                                        {part.name}
                                                    </h3>
                                                </div>

                                                {/* Price Section: Giá Nhập & Giá Bán Tham Khảo (+40%) */}
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                                                    {/* Giá Nhập (Import/Cost Price) */}
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 dark:text-slate-500 font-medium">Giá nhập:</span>
                                                        <span className="font-semibold text-slate-600 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600">
                                                            {formatCurrency(part.price)}
                                                        </span>
                                                    </div>

                                                    {/* Giá Bán Tham Khảo (+40%) */}
                                                    <div className="flex flex-col bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                                                <TrendingUp className="w-3 h-3" />
                                                                <span>Giá bán (+40%)</span>
                                                            </span>
                                                        </div>
                                                        <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                            {formatCurrency(sellingPrice)}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1.5 pt-1">
                                                        <button
                                                            onClick={() => handleAddToInventory(part)}
                                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Báo giá / Chọn</span>
                                                        </button>
                                                        {part.source_url && (
                                                            <a
                                                                href={part.source_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                                                title="Xem trang gốc"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Table View */
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hình ảnh</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Mã SKU</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tên phụ tùng</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Giá nhập gốc</th>
                                                <th className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Giá bán (+40%)</th>
                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs sm:text-sm">
                                            {parts.map((part) => {
                                                const sellingPrice = part.price * 1.4;
                                                return (
                                                    <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="w-12 h-12 relative overflow-hidden rounded border border-slate-200 dark:border-slate-700 bg-white p-0.5">
                                                                <ImageWithFallback src={part.image_url || ''} alt={part.name} sku={part.sku || ''} />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            {part.sku || '---'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-900 dark:text-slate-100">{part.name}</div>
                                                            {part.category && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{part.category}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                                                            {formatCurrency(part.price)}
                                                        </td>
                                                        <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                                                            {formatCurrency(sellingPrice)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
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
                                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                                                                    title="Chọn phụ tùng"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Chọn</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination Bar */}
                    {parts.length > 0 && (
                        <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex items-center justify-between shadow-sm">
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Trang <span className="text-blue-600 dark:text-blue-400 font-bold">{page}</span> / {totalPages} • {totalCount.toLocaleString('vi-VN')} phụ tùng
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                >
                                    ← Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    )}
                </main>
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



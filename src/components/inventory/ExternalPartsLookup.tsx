import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Download, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ExternalPart } from '../../types';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-toastify';

export default function ExternalPartsLookup() {
    const [parts, setParts] = useState<ExternalPart[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .rpc('get_external_part_categories');

            if (error) throw error;

            // Data is already unique and sorted from RPC
            const uniqueCategories = data?.map((item: any) => item.category) || [];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to manual fetch if RPC fails
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
            if (count) {
                setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
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

    const handleAddToInventory = (part: ExternalPart) => {
        // This would ideally open the "Add Part" modal with pre-filled data
        // For now, we'll just show a toast or emit an event
        toast.success(`Đã chọn: ${part.name}. Tính năng thêm vào kho đang phát triển.`);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tra cứu phụ tùng ngoài</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Tra cứu giá và thông tin phụ tùng từ nguồn dữ liệu bên ngoài (xemay.net)
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            fetchParts();
                            fetchCategories();
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Làm mới"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="p-6 pb-0">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="bg-white rounded-lg border p-4 shadow-sm flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên phụ tùng hoặc mã SKU..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1); // Reset to page 1 on search
                                }}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-4 shadow-sm w-full md:w-64">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setPage(1);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">-- Tất cả mẫu xe --</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase border-b">Hình ảnh</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase border-b">Mã SKU</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase border-b">Tên phụ tùng</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase border-b">Giá tham khảo</th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase border-b text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : parts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Không tìm thấy phụ tùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    parts.map((part) => (
                                        <tr key={part.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 border-b">
                                                {part.image_url ? (
                                                    <img
                                                        src={part.image_url}
                                                        alt={part.name}
                                                        className="w-12 h-12 object-cover rounded border"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-gray-400 text-xs">
                                                        No img
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 border-b font-mono text-sm text-gray-600">
                                                {part.sku || '---'}
                                            </td>
                                            <td className="px-6 py-4 border-b">
                                                <div className="font-medium text-gray-900">{part.name}</div>
                                                <div className="text-xs text-gray-500">{part.category}</div>
                                            </td>
                                            <td className="px-6 py-4 border-b font-medium text-blue-600">
                                                {formatCurrency(part.price)}
                                            </td>
                                            <td className="px-6 py-4 border-b text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {part.source_url && (
                                                        <a
                                                            href={part.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Xem nguồn"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleAddToInventory(part)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Thêm vào kho"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Trang {page} / {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 border rounded bg-white disabled:opacity-50 hover:bg-gray-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

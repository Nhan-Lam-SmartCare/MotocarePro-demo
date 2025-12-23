/**
 * Category to color mapping for visual distinction
 * Returns Tailwind CSS classes for background and text colors
 */

export interface CategoryColors {
    bg: string;
    text: string;
}

const CATEGORY_COLOR_MAP: Record<string, CategoryColors> = {
    // Nhớt, dầu
    Nhớt: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
    },
    Dầu: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
    },
    // Lọc
    Lọc: {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        text: "text-cyan-700 dark:text-cyan-400",
    },
    "Lọc gió": {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        text: "text-cyan-700 dark:text-cyan-400",
    },
    "Lọc nhớt": {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        text: "text-cyan-700 dark:text-cyan-400",
    },
    // Bugi
    Bugi: {
        bg: "bg-rose-100 dark:bg-rose-900/30",
        text: "text-rose-700 dark:text-rose-400",
    },
    // Phanh
    Phanh: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
    },
    "Má phanh": {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
    },
    // Xích, sên
    Xích: {
        bg: "bg-zinc-200 dark:bg-zinc-700/50",
        text: "text-zinc-700 dark:text-zinc-300",
    },
    Sên: {
        bg: "bg-zinc-200 dark:bg-zinc-700/50",
        text: "text-zinc-700 dark:text-zinc-300",
    },
    "Nhông sên dĩa": {
        bg: "bg-zinc-200 dark:bg-zinc-700/50",
        text: "text-zinc-700 dark:text-zinc-300",
    },
    // Lốp, vỏ
    Lốp: {
        bg: "bg-slate-700 dark:bg-slate-600",
        text: "text-white dark:text-slate-100",
    },
    "Vỏ xe": {
        bg: "bg-slate-700 dark:bg-slate-600",
        text: "text-white dark:text-slate-100",
    },
    // Ắc quy
    "Ắc quy": {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
    },
    "Bình điện": {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
    },
    // Đèn
    Đèn: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
    },
    "Bóng đèn": {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
    },
    // Phụ tùng điện
    Điện: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
    },
    IC: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
    },
    // Gioăng, ron
    Gioăng: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-400",
    },
    Ron: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-400",
    },
    // Vòng bi
    "Vòng bi": {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-400",
    },
    "Bạc đạn": {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-400",
    },
    // Cao su
    "Cao su": {
        bg: "bg-stone-200 dark:bg-stone-700/50",
        text: "text-stone-700 dark:text-stone-300",
    },
    // Phụ kiện
    "Phụ kiện": {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
    },
    // === THƯƠNG HIỆU / HÃNG XE === (màu nhạt, dễ nhìn)
    // Honda - Đỏ nhạt
    Honda: {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-700 dark:text-red-400",
    },
    // Yamaha - Xanh dương nhạt
    Yamaha: {
        bg: "bg-blue-100 dark:bg-blue-900/40",
        text: "text-blue-700 dark:text-blue-400",
    },
    // Suzuki - Xanh dương đậm nhạt
    Suzuki: {
        bg: "bg-blue-200 dark:bg-blue-900/50",
        text: "text-blue-800 dark:text-blue-300",
    },
    // SYM - Xanh sky nhạt
    SYM: {
        bg: "bg-sky-100 dark:bg-sky-900/40",
        text: "text-sky-700 dark:text-sky-400",
    },
    // Piaggio/Vespa - Xanh emerald nhạt
    Piaggio: {
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
        text: "text-emerald-700 dark:text-emerald-400",
    },
    Vespa: {
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
        text: "text-emerald-700 dark:text-emerald-400",
    },
    // Kymco - Cam nhạt
    Kymco: {
        bg: "bg-orange-100 dark:bg-orange-900/40",
        text: "text-orange-700 dark:text-orange-400",
    },
    // === THƯƠNG HIỆU PHỤ TÙNG ===
    // NGK - Xanh lá nhạt
    NGK: {
        bg: "bg-green-100 dark:bg-green-900/40",
        text: "text-green-700 dark:text-green-400",
    },
    // Denso - Hồng nhạt
    Denso: {
        bg: "bg-rose-100 dark:bg-rose-900/40",
        text: "text-rose-700 dark:text-rose-400",
    },
    DENSO: {
        bg: "bg-rose-100 dark:bg-rose-900/40",
        text: "text-rose-700 dark:text-rose-400",
    },
    // Kenda - Vàng amber nhạt
    Kenda: {
        bg: "bg-amber-100 dark:bg-amber-900/40",
        text: "text-amber-700 dark:text-amber-400",
    },
    // IRC - Tím nhạt
    IRC: {
        bg: "bg-violet-100 dark:bg-violet-900/40",
        text: "text-violet-700 dark:text-violet-400",
    },
    "IRC Tire": {
        bg: "bg-violet-100 dark:bg-violet-900/40",
        text: "text-violet-700 dark:text-violet-400",
    },
    // Michelin - Xanh đậm nhạt
    Michelin: {
        bg: "bg-indigo-100 dark:bg-indigo-900/40",
        text: "text-indigo-700 dark:text-indigo-400",
    },
    // Dunlop - Vàng nhạt
    Dunlop: {
        bg: "bg-yellow-100 dark:bg-yellow-900/40",
        text: "text-yellow-700 dark:text-yellow-400",
    },
    // Castrol - Xanh lá nhạt
    Castrol: {
        bg: "bg-lime-100 dark:bg-lime-900/40",
        text: "text-lime-700 dark:text-lime-400",
    },
    // Shell - Vàng nhạt
    Shell: {
        bg: "bg-amber-100 dark:bg-amber-900/40",
        text: "text-amber-700 dark:text-amber-400",
    },
    // Motul - Đỏ nhạt
    Motul: {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-700 dark:text-red-400",
    },
    // Bosch - Xám nhạt
    Bosch: {
        bg: "bg-slate-200 dark:bg-slate-700/50",
        text: "text-slate-700 dark:text-slate-300",
    },
    // Default
    Khác: {
        bg: "bg-slate-100 dark:bg-slate-700",
        text: "text-slate-600 dark:text-slate-400",
    },
};

const HASH_COLORS: CategoryColors[] = [
    {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-700 dark:text-pink-400",
    },
    {
        bg: "bg-violet-100 dark:bg-violet-900/30",
        text: "text-violet-700 dark:text-violet-400",
    },
    {
        bg: "bg-teal-100 dark:bg-teal-900/30",
        text: "text-teal-700 dark:text-teal-400",
    },
    {
        bg: "bg-lime-100 dark:bg-lime-900/30",
        text: "text-lime-700 dark:text-lime-400",
    },
    {
        bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
        text: "text-fuchsia-700 dark:text-fuchsia-400",
    },
    {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
    },
];

const DEFAULT_COLOR: CategoryColors = {
    bg: "bg-slate-100 dark:bg-slate-700",
    text: "text-slate-500 dark:text-slate-400",
};

/**
 * Get color scheme for a product category
 * @param category - Product category name
 * @returns CategoryColors object with bg and text Tailwind classes
 */
export function getCategoryColor(
    category: string | undefined
): CategoryColors {
    if (!category) return DEFAULT_COLOR;

    // Try exact match first
    if (CATEGORY_COLOR_MAP[category]) return CATEGORY_COLOR_MAP[category];

    // Try partial match (case-insensitive)
    const lowerCat = category.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_COLOR_MAP)) {
        if (
            lowerCat.includes(key.toLowerCase()) ||
            key.toLowerCase().includes(lowerCat)
        ) {
            return value;
        }
    }

    // Generate consistent color based on category string hash
    const hash = category
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return HASH_COLORS[hash % HASH_COLORS.length];
}

/**
 * Normalize barcode/SKU by removing special characters for comparison
 * 
 * Examples:
 * - Honda: 06455-KYJ-841 → 06455kyj841
 * - Yamaha: 5S9-F2101-00 → 5s9f210100
 * 
 * @param code - Barcode or SKU string
 * @returns Normalized lowercase string without special characters
 */
export function normalizeCode(code: string): string {
    return code.toLowerCase().replace(/[-\s./\\]/g, "");
}

import React, { useState, useEffect, useCallback } from "react";
import { formatNumberWithDots, parseFormattedNumber } from "../../utils/format";

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  /** Whether to allow decimal numbers */
  allowDecimal?: boolean;
  /** Suffix to display (e.g., "đ", "%") */
  suffix?: string;
}

/**
 * Number input with Vietnamese thousand separator formatting (dots)
 * 
 * Displays numbers with dots (e.g., 1.500.000) while editing,
 * and returns clean numeric values on change.
 * 
 * @example
 * ```tsx
 * <NumberInput
 *   value={laborCost}
 *   onChange={(val) => setLaborCost(val)}
 *   placeholder="0"
 *   className="w-full px-3 py-2 ..."
 * />
 * ```
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  allowDecimal = false,
  suffix,
  className,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  // Sync display value when external value changes
  useEffect(() => {
    const numValue = typeof value === "string" ? parseFormattedNumber(value) : (value || 0);
    setDisplayValue(numValue ? formatNumberWithDots(numValue) : "");
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty input
      if (inputValue === "") {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Remove all non-numeric characters except dots and commas
      let cleaned = inputValue.replace(/[^\d.,]/g, "");
      
      // For decimal, replace comma with dot for parsing
      if (allowDecimal) {
        // Keep only the last decimal separator
        const parts = cleaned.split(/[.,]/);
        if (parts.length > 2) {
          cleaned = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
        } else if (parts.length === 2) {
          cleaned = parts[0] + "." + parts[1];
        }
      } else {
        // Remove all dots and commas for integer
        cleaned = cleaned.replace(/[.,]/g, "");
      }

      // Parse to number
      const numValue = parseFloat(cleaned);
      
      if (isNaN(numValue)) {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Format and display
      if (allowDecimal) {
        // For decimals, format integer part and keep decimal part
        const [intPart, decPart] = cleaned.split(".");
        const formattedInt = formatNumberWithDots(parseInt(intPart) || 0);
        setDisplayValue(decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt);
      } else {
        setDisplayValue(formatNumberWithDots(numValue));
      }
      
      onChange(numValue);
    },
    [onChange, allowDecimal]
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Select all on focus for easy replacement
    e.target.select();
    props.onFocus?.(e);
  }, [props]);

  return (
    <div className="relative">
      <input
        {...props}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className={className}
      />
      {suffix && displayValue && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

export default NumberInput;

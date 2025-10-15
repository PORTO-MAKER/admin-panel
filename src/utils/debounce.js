import { useState, useEffect } from "react";

// Custom hook untuk menunda eksekusi (debounce)
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Atur timer untuk memperbarui nilai setelah 'delay'
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Bersihkan timer setiap kali 'value' atau 'delay' berubah
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

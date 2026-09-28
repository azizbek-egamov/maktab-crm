import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal/drawer is open
 * @param {boolean} isLocked
 */
export const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (!isLocked) return;

        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, [isLocked]);
};

export default useBodyScrollLock;

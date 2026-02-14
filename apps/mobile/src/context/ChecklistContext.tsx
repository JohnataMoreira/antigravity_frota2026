import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ChecklistItem {
    itemId: string;
    itemName: string;
    status: 'OK' | 'PROBLEM';
    photoUrl?: string;
    notes?: string;
}

interface ChecklistContextType {
    checkoutItems: ChecklistItem[];
    checkinItems: ChecklistItem[];
    setCheckoutItems: (items: ChecklistItem[]) => void;
    setCheckinItems: (items: ChecklistItem[]) => void;
    clearChecklist: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export function ChecklistProvider({ children }: { children: ReactNode }) {
    const [checkoutItems, setCheckoutItems] = useState<ChecklistItem[]>([]);
    const [checkinItems, setCheckinItems] = useState<ChecklistItem[]>([]);

    const clearChecklist = () => {
        setCheckoutItems([]);
        setCheckinItems([]);
    };

    return (
        <ChecklistContext.Provider
            value={{
                checkoutItems,
                checkinItems,
                setCheckoutItems,
                setCheckinItems,
                clearChecklist,
            }}
        >
            {children}
        </ChecklistContext.Provider>
    );
}

export function useChecklist() {
    const context = useContext(ChecklistContext);
    if (!context) {
        throw new Error('useChecklist must be used within ChecklistProvider');
    }
    return context;
}

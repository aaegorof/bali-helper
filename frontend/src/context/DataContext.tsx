import React, { createContext, useContext, useState, useEffect } from 'react';

interface DataContextType {
    dataFiles: string[];
    refreshDataFiles: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dataFiles, setDataFiles] = useState<string[]>([]);

    const fetchDataFiles = async () => {
        try {
            const response = await fetch('http://localhost:8000/data-files');
            const data = await response.json();
            setDataFiles(data.files);
        } catch (err) {
            console.error('Ошибка при загрузке списка файлов:', err);
        }
    };

    const refreshDataFiles = async () => {
        await fetchDataFiles();
    };

    useEffect(() => {
        fetchDataFiles();
    }, []);

    return (
        <DataContext.Provider value={{ dataFiles, refreshDataFiles }}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
}; 
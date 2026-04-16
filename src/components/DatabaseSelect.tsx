import { FieldSelect } from '@looker/components';
import { ExtensionContext } from '@looker/extension-sdk-react';
import React, { useContext, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useAppContext } from '../AppContext';
import useSdk from '../hooks/useSdk';

const DatabaseSelect: React.FC = () => {
    const sdk = useSdk();
    const { extensionSDK } = useContext(ExtensionContext);
    const { connection, database, updateDatabase } = useAppContext();
    const [filter_text, setFilterText] = useState('');

    const swrKey = connection ? `databases?connection=${connection.name}` : null;

    const { data: databases, isLoading: is_loading, mutate } = useSWR(
        swrKey,
        () => sdk.ok(sdk.connection_databases(connection?.name || '')),
        {
            revalidateOnMount: true, // Restores caches but refreshes naturally on mount
        }
    );

    // Restore from localStorage into SWR cache on mount/connection-change
    useEffect(() => {
        const restoreLocal = async () => {
            if (extensionSDK && connection) {
                try {
                    const saved = await extensionSDK.localStorageGetItem(
                        `databases_${connection.name}`,
                    );
                    if (saved) {
                        mutate(JSON.parse(saved), false);
                    }
                } catch (e) {
                    console.error('Failed to load databases from cache', e);
                }
            }
        };
        restoreLocal();
    }, [connection, extensionSDK]);

    // Save to localStorage when successfully fetched
    useEffect(() => {
        if (databases && extensionSDK && connection) {
            extensionSDK.localStorageSetItem(
                `databases_${connection.name}`,
                JSON.stringify(databases),
            );
        }
    }, [databases, extensionSDK, connection]);

    const handleFilter = (term: string) => {
        setFilterText(term);
    };

    const options = React.useMemo(() => {
        const baseOptions = databases ? [...databases] : [];
        if (database && !baseOptions.includes(database)) {
            baseOptions.push(database);
        }
        const filtered = baseOptions.filter((db) =>
            String(db || '').toLowerCase().includes(filter_text.toLowerCase()),
        );
        return filtered
            .sort((a, b) => String(a || '').localeCompare(String(b || '')))
            .map((db) => ({ label: db, value: db }));
    }, [databases, filter_text, database]);

    const handleChange = (val?: string) => {
        updateDatabase(val || undefined);
    };

    return (
        <FieldSelect
            label='GCP Project'
            name='database_select'
            options={options}
            value={database}
            onChange={handleChange}
            isFilterable={true}
            onFilter={handleFilter}
            showCreate={true}
            formatCreateLabel={(term) => `+ ${term}`}
            isLoading={is_loading}
            width='200px'
        />
    );
};

export default DatabaseSelect;

import { FieldSelect } from '@looker/components';
import { IDBConnection } from '@looker/sdk';
import React from 'react';
import useSWR from 'swr';
import useSdk from '../hooks/useSdk';

interface ConnectionSelectProps {
    value?: IDBConnection;
    onChange: (value: IDBConnection | undefined) => void;
    label?: string;
    name?: string;
}

const ConnectionSelect: React.FC<ConnectionSelectProps> = ({
    value,
    onChange,
    label = 'Connection',
    name = 'connection',
}) => {
    const sdk = useSdk();
    const { data: connections, isLoading: is_loading } = useSWR(
        'all_connections',
        () => sdk.ok(sdk.all_connections('name')),
    );

    const options =
        connections
            ?.sort((a: any, b: any) =>
                (a.name || '').localeCompare(b.name || ''),
            )
            .map((c: any) => ({
                label: c.name || '',
                value: c.name || '',
            })) || [];

    const handleSelectChange = (name?: string) => {
        if (!name) {
            onChange(undefined);
            return;
        }
        const selected = connections?.find((c: any) => c.name === name);
        onChange(selected);
    };

    return (
        <FieldSelect
            name={name}
            label={label}
            options={options}
            value={value?.name}
            onChange={handleSelectChange}
            isLoading={is_loading}
        />
    );
};

export default ConnectionSelect;

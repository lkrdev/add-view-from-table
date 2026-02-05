import {
    Box,
    IconButton,
    List,
    ListItem,
    Popover,
    ProgressCircular,
    Text,
} from '@looker/components';
import { ISchemaColumn } from '@looker/sdk';
import { Info } from '@styled-icons/material/Info';
import React from 'react';
import useSWR from 'swr';
import useSdk from '../hooks/useSdk';

interface TableColumnsPopoverProps {
    connection_name: string;
    schema_name: string;
    table_name: string;
}

const TableColumnsPopoverContent = ({
    connection_name,
    schema_name,
    table_name,
}: TableColumnsPopoverProps) => {
    const sdk = useSdk();
    const {
        data,
        isLoading: is_loading,
        error,
    } = useSWR(
        `connection_columns/${connection_name}/${schema_name}/${table_name}`,
        async () => {
            const r = await sdk.ok(
                sdk.connection_columns({
                    schema_name,
                    connection_name,
                    table_names: table_name,
                }),
            );
            return r.reduce((acc, table_column) => {
                if (table_column.columns?.length) {
                    acc = [...acc, ...table_column.columns];
                }
                return acc;
            }, [] as ISchemaColumn[]);
        },
    );

    if (is_loading) {
        return (
            <Box p='u4' display='flex' justifyContent='center'>
                <ProgressCircular size='small' />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p='u4'>
                <Text color='critical'>Error: {error.message}</Text>
            </Box>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Box p='u4'>
                <Text color='subdued'>No columns found</Text>
            </Box>
        );
    }

    return (
        <Box
            p='u2'
            width='250px'
            maxHeight='400px'
            style={{ overflowY: 'auto' }}
        >
            <Box mb='u2'>
                <Text fontWeight='bold'>Columns</Text>
            </Box>
            <List>
                {data.map((col) => (
                    <ListItem key={col.name}>
                        <Text fontSize='small'>{col.name}</Text>
                        {col.data_type && (
                            <Text fontSize='xsmall' color='subdued' ml='u1'>
                                ({col.data_type})
                            </Text>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export const TableColumnsPopover = (props: TableColumnsPopoverProps) => {
    return (
        <Popover content={<TableColumnsPopoverContent {...props} />} pin>
            <IconButton
                className='hover-reveal'
                icon={<Info />}
                label='View Columns'
                size='xsmall'
                onClick={(e) => e.stopPropagation()}
            />
        </Popover>
    );
};

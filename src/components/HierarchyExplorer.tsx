import {
    Box,
    Checkbox,
    Divider,
    InputSearch,
    InputText,
    Label,
    MessageBar,
    ProgressCircular,
    Space,
    SpaceVertical,
    Text,
    Tree,
    TreeItem,
} from '@looker/components';
import { ISchemaTable } from '@looker/sdk';
import React from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import { useDebounceValue } from 'usehooks-ts';
import { useAppContext } from '../AppContext';
import useSdk from '../hooks/useSdk';
import { TableColumnsPopover } from './TableColumnsPopover';

const StyledTreeItem = styled(TreeItem)`
    .hover-reveal {
        visibility: hidden;
    }
    &:hover .hover-reveal {
        visibility: visible;
    }
`;

const HierarchyExplorer = () => {
    const {
        table_filter,
        updateTableFilter,
        connection,
        table_filter_limit,
        updateTableFilterLimit,
        selected_tables,
        updateSelectedTables,
    } = useAppContext();
    const [debounced_value] = useDebounceValue(table_filter, 500);

    const sdk = useSdk();
    const {
        data: schemas,
        isLoading: is_loading,
        error,
    } = useSWR(
        connection
            ? `all_tables?connection=${connection?.name}&filter=${debounced_value}&limit=${table_filter_limit}`
            : null,
        async () => {
            return await sdk.ok(
                sdk.connection_tables({
                    connection_name: connection?.name || '',
                    table_filter: debounced_value,
                    table_limit: table_filter_limit,
                }),
            );
        },
    );

    // Equality check for SelectedTable
    const isSameTable = (a: SelectedTable, b: SelectedTable) =>
        a.connection === b.connection &&
        a.database === b.database &&
        a.schema === b.schema &&
        a.table_name === b.table_name;

    // Helper to check if a specific table is selected
    const isTableSelected = (schema: string | undefined, table_name: string) =>
        selected_tables.some((t) =>
            isSameTable(t, {
                connection: connection?.name || '',
                database: '', // connection_tables doesn't seem to return database clearly, using empty for now
                schema: schema || '',
                table_name,
            }),
        );

    // Handle schema-level checkbox change
    const handleSchemaChange = (
        schema_name: string | undefined,
        tables: ISchemaTable[],
    ) => {
        const schema_tables: SelectedTable[] = tables
            .filter((t) => t.name)
            .map((t) => ({
                connection: connection?.name || '',
                database: '',
                schema: schema_name || '',
                table_name: t.name!,
            }));

        const all_selected = schema_tables.every((st) =>
            selected_tables.some((t) => isSameTable(t, st)),
        );

        if (all_selected) {
            // Unselect all in this schema
            updateSelectedTables(
                selected_tables.filter(
                    (t) => !schema_tables.some((st) => isSameTable(st, t)),
                ),
            );
        } else {
            // Select all in this schema (merge with existing)
            const filtered_selection = selected_tables.filter(
                (t) => !schema_tables.some((st) => isSameTable(st, t)),
            );
            updateSelectedTables([...filtered_selection, ...schema_tables]);
        }
    };

    // Handle table-level checkbox change
    const handleTableToggle = (
        schema: string | undefined,
        table_name: string,
    ) => {
        const target: SelectedTable = {
            connection: connection?.name || '',
            database: '',
            schema: schema || '',
            table_name,
        };

        if (selected_tables.some((t) => isSameTable(t, target))) {
            updateSelectedTables(
                selected_tables.filter((t) => !isSameTable(t, target)),
            );
        } else {
            updateSelectedTables([...selected_tables, target]);
        }
    };

    // Calculate schema checkbox state: true, false, or 'mixed'
    const getSchemaState = (
        schema_name: string | undefined,
        tables: ISchemaTable[],
    ) => {
        if (!tables || tables.length === 0) return false;
        const valid_tables = tables.filter((t) => t.name);
        const selected_count = valid_tables.filter((t) =>
            isTableSelected(schema_name, t.name!),
        ).length;

        if (selected_count === 0) return false;
        if (selected_count === valid_tables.length) return true;
        return 'mixed';
    };

    return (
        <SpaceVertical gap='u4' height='100%' overflow='hidden'>
            <Space px='u4'>
                <SpaceVertical gap='u1' flexGrow={1}>
                    <Label htmlFor='table_search'>Search tables</Label>
                    <InputSearch
                        id='table_search'
                        value={table_filter}
                        onChange={updateTableFilter}
                        placeholder='Search tables...'
                    />
                </SpaceVertical>
                <SpaceVertical gap='u1' width='100px'>
                    <Label htmlFor='table_limit'>Limit</Label>
                    <InputText
                        id='table_limit'
                        type='number'
                        value={String(table_filter_limit)}
                        onChange={(e) =>
                            updateTableFilterLimit(
                                Number(e.currentTarget.value),
                            )
                        }
                    />
                </SpaceVertical>
            </Space>
            <Divider />
            {is_loading && (
                <Box display='flex' justifyContent='center' py='u8'>
                    <ProgressCircular />
                </Box>
            )}
            {error && (
                <MessageBar intent='critical'>
                    Error loading tables: {error.message}
                </MessageBar>
            )}
            {!is_loading && !error && schemas && (
                <Box
                    flex={1}
                    px='u4'
                    style={{ overflowY: 'auto' }}
                    width='100%'
                >
                    <SpaceVertical gap='u1'>
                        {schemas.length === 0 ? (
                            <Text color='subdued' textAlign='center' py='u8'>
                                No tables found
                            </Text>
                        ) : (
                            schemas.map((schema) => {
                                const schema_state = getSchemaState(
                                    schema.name,
                                    schema.tables || [],
                                );
                                const schema_name_fallback =
                                    schema.name || 'Default Schema';
                                if (!schema.tables?.length) {
                                    return null;
                                }
                                return (
                                    <Tree
                                        key={schema.name || 'default'}
                                        label={
                                            <Space
                                                gap='u2'
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Checkbox
                                                    checked={schema_state}
                                                    onChange={() =>
                                                        handleSchemaChange(
                                                            schema.name,
                                                            schema.tables || [],
                                                        )
                                                    }
                                                />
                                                <Text>
                                                    {schema_name_fallback}
                                                </Text>
                                            </Space>
                                        }
                                        defaultOpen={true}
                                    >
                                        {schema.tables?.map((table) => {
                                            if (!table.name) return null;
                                            const is_selected = isTableSelected(
                                                schema.name,
                                                table.name,
                                            );
                                            return (
                                                <StyledTreeItem
                                                    key={table.name}
                                                    detail={
                                                        <TableColumnsPopover
                                                            connection_name={
                                                                connection?.name ||
                                                                ''
                                                            }
                                                            schema_name={
                                                                schema.name ||
                                                                ''
                                                            }
                                                            table_name={
                                                                table.name!
                                                            }
                                                        />
                                                    }
                                                >
                                                    <Space
                                                        gap='u2'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTableToggle(
                                                                schema.name,
                                                                table.name!,
                                                            );
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                is_selected
                                                            }
                                                            onChange={() =>
                                                                handleTableToggle(
                                                                    schema.name,
                                                                    table.name!,
                                                                )
                                                            }
                                                        />
                                                        <Text>
                                                            {table.name}
                                                        </Text>
                                                    </Space>
                                                </StyledTreeItem>
                                            );
                                        })}
                                    </Tree>
                                );
                            })
                        )}
                    </SpaceVertical>
                </Box>
            )}
        </SpaceVertical>
    );
};

export default HierarchyExplorer;

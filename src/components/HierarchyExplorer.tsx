import {
    Box,
    ButtonTransparent,
    Checkbox,
    Divider,
    IconButton,
    InputSearch,
    InputText,
    Label,
    MessageBar,
    ProgressCircular,
    Space,
    SpaceVertical,
    Text,
    Tooltip,
    Tree,
    TreeItem,
} from '@looker/components';
import { ISchemaTable } from '@looker/sdk';
import { UnfoldLess, UnfoldMore } from '@styled-icons/material';
import { Refresh } from '@styled-icons/material/Refresh';
import React, { useEffect, useState } from 'react';
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

    const [expanded_schemas, setExpandedSchemas] = useState<
        Record<string, boolean>
    >({});

    const {
        data: schemas,
        isLoading: is_loading,
        error,
        mutate,
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

    // Initialize all schemas to open when data is loaded
    useEffect(() => {
        if (schemas && Object.keys(expanded_schemas).length === 0) {
            const initial_state: Record<string, boolean> = {};
            schemas.forEach((s) => {
                if (s.name) initial_state[s.name] = true;
            });
            setExpandedSchemas(initial_state);
        }
    }, [schemas]);

    const handleToggleSchema = (schema_name: string, isOpen: boolean) => {
        setExpandedSchemas((prev) => ({
            ...prev,
            [schema_name]: isOpen,
        }));
    };

    const handleFoldAll = () => {
        if (!schemas) return;
        const new_state: Record<string, boolean> = {};
        schemas.forEach((s) => {
            if (s.name) new_state[s.name] = false;
        });
        setExpandedSchemas(new_state);
    };

    const handleUnfoldAll = () => {
        if (!schemas) return;
        const new_state: Record<string, boolean> = {};
        schemas.forEach((s) => {
            if (s.name) new_state[s.name] = true;
        });
        setExpandedSchemas(new_state);
    };

    // Sort schemas alphabetically
    const sorted_schemas = React.useMemo(() => {
        if (!schemas) return [];
        return [...schemas].sort((a, b) => {
            const name_a = a.name || '';
            const name_b = b.name || '';
            return name_a.localeCompare(name_b, undefined, {
                sensitivity: 'base',
            });
        });
    }, [schemas]);

    const [is_refreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        if (!connection) return;
        setIsRefreshing(true);
        try {
            const result = await sdk.ok(
                sdk.connection_tables({
                    connection_name: connection.name || '',
                    table_filter: debounced_value,
                    table_limit: table_filter_limit,
                    cache: false,
                }),
            );
            mutate(result, false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

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
            <Space px='u4' gap='u4' between width='100%' align='center'>
                <Space flexGrow={1} gap='u2'>
                    <SpaceVertical gap='u1' flexGrow={1}>
                        <Label htmlFor='table_search'>Search tables</Label>
                        <InputSearch
                            id='table_search'
                            value={table_filter}
                            onChange={updateTableFilter}
                            placeholder='Search tables...'
                            width='100%'
                        />
                    </SpaceVertical>
                    <SpaceVertical gap='u1' width='150px' flexShrink={0}>
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
                <Space
                    gap='u2'
                    align='center'
                    width='fit-content'
                    alignSelf='flex-end'
                >
                    <Tooltip content='Refresh Schemas'>
                        <IconButton
                            icon={<Refresh />}
                            label='Refresh Schemas'
                            onClick={handleRefresh}
                            disabled={is_refreshing}
                            size='small'
                        />
                    </Tooltip>
                    <ButtonTransparent
                        size='xsmall'
                        iconBefore={<UnfoldLess />}
                        onClick={handleFoldAll}
                        disabled={!schemas || schemas.length === 0}
                    >
                        Fold All
                    </ButtonTransparent>
                    <ButtonTransparent
                        size='xsmall'
                        iconBefore={<UnfoldMore />}
                        onClick={handleUnfoldAll}
                        disabled={!schemas || schemas.length === 0}
                    >
                        Unfold All
                    </ButtonTransparent>
                </Space>
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
            {!is_loading && !error && sorted_schemas && (
                <Box
                    flex={1}
                    px='u4'
                    style={{ overflowY: 'auto' }}
                    width='100%'
                >
                    <SpaceVertical gap='u1'>
                        {sorted_schemas.length === 0 ? (
                            <Text color='subdued' textAlign='center' py='u8'>
                                No tables found
                            </Text>
                        ) : (
                            sorted_schemas.map((schema: any) => {
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
                                        isOpen={
                                            expanded_schemas[schema.name!] ??
                                            true
                                        }
                                        onOpen={() =>
                                            handleToggleSchema(
                                                schema.name!,
                                                true,
                                            )
                                        }
                                        onClose={() =>
                                            handleToggleSchema(
                                                schema.name!,
                                                false,
                                            )
                                        }
                                    >
                                        {schema.tables?.map(
                                            (table: ISchemaTable) => {
                                                if (!table.name) return null;
                                                const is_selected =
                                                    isTableSelected(
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
                                            },
                                        )}
                                    </Tree>
                                );
                            })
                        )}
                    </SpaceVertical>
                </Box>
            )}
        </SpaceVertical>
    );
};;

export default HierarchyExplorer;

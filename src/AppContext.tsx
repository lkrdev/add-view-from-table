import { ExtensionContext } from '@looker/extension-sdk-react';
import { IDBConnection, IUser } from '@looker/sdk';
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import useSdk from './hooks/useSdk';

export type GlobalFilters = { [key: string]: string };

interface AppContextType {
    is_loading: boolean;
    me: IUser | undefined;
    project: string;
    updateProject: (project: string) => void;
    connection: IDBConnection | undefined;
    updateDbConnection: (connection: IDBConnection | undefined) => void;
    getSearchParams: (global_filters?: boolean) => Record<string, string>;
    updateSearchParams: (
        params: Record<string, string | undefined | null>,
    ) => void;
    table_filter: string;
    updateTableFilter: (table_filter: string) => void;
    table_filter_limit: number;
    updateTableFilterLimit: (table_filter_limit: number) => void;
    selected_tables: SelectedTable[];
    updateSelectedTables: (selected_tables: SelectedTable[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const location = useLocation();
    const current_search_ref = useRef(
        Object.fromEntries(new URLSearchParams(location.search)),
    );

    useEffect(() => {
        current_search_ref.current = Object.fromEntries(
            new URLSearchParams(location.search),
        );
    }, [location]);

    const getSearchParams = (global_filters?: boolean) => {
        const { sandboxed_host, sdk, _theme, ...global_filters_params } =
            current_search_ref.current;
        if (global_filters) {
            return global_filters_params;
        } else {
            return { ...global_filters_params };
        }
    };
    const sdk = useSdk();
    const { extensionSDK } = useContext(ExtensionContext);
    const [project, setProjectState] = useState(
        getSearchParams().project || '',
    );
    const [connection, setConnectionState] = useState<
        IDBConnection | undefined
    >();
    const [table_filter, setTableFilter] = useState(
        getSearchParams().table_filter,
    );
    const [table_filter_limit, setTableFilterLimit] = useState(() => {
        const limit = Number(getSearchParams().table_filter_limit);
        return !isNaN(limit) && limit > 0 ? limit : 100;
    });
    const [selected_tables, setSelectedTables] = useState<SelectedTable[]>([]);

    const { data: me, isLoading: is_loading_me } = useSWR('me', () =>
        sdk.ok(sdk.me()),
    );
    const { data: connections, isLoading: is_loading_connections } = useSWR(
        'all_connections',
        () => sdk.ok(sdk.all_connections('name')),
    );

    const is_loading = is_loading_me || is_loading_connections;

    const updateProject = (new_project: string) => {
        setProjectState(new_project);
        if (extensionSDK) {
            extensionSDK.localStorageSetItem('selected_project', new_project);
        }
        updateSearchParams({ project: new_project });
    };

    const updateDbConnection = (new_connection: IDBConnection | undefined) => {
        setConnectionState(new_connection);
        if (extensionSDK) {
            extensionSDK.localStorageSetItem(
                'selected_connection',
                new_connection?.name || '',
            );
        }
        updateSearchParams({ connection: new_connection?.name });
        setSelectedTables([]);
    };

    useEffect(() => {
        const loadInitialConnection = async () => {
            if (connections && !connection) {
                const url_conn_name = getSearchParams().connection;
                const storage_conn_name =
                    await extensionSDK?.localStorageGetItem(
                        'selected_connection',
                    );
                const name_to_find = url_conn_name || storage_conn_name;

                if (name_to_find) {
                    const found = connections.find(
                        (c: IDBConnection) => c.name === name_to_find,
                    );
                    if (found) {
                        updateDbConnection(found);
                        return;
                    }
                }

                // Fallback: Use the first alphabetical connection
                if (connections.length > 0) {
                    const sorted = [...connections].sort((a, b) =>
                        (a.name || '').localeCompare(b.name || ''),
                    );
                    updateDbConnection(sorted[0]);
                }
            }
        };
        loadInitialConnection();
    }, [connections, extensionSDK]);

    useEffect(() => {
        const loadSavedValues = async () => {
            if (extensionSDK) {
                if (!project) {
                    const saved_project =
                        await extensionSDK.localStorageGetItem(
                            'selected_project',
                        );
                    if (saved_project) updateProject(saved_project);
                }
            }
        };
        loadSavedValues();
    }, [extensionSDK]);

    const history = useHistory();

    const updateSearchParams = (
        params: Record<string, string | undefined | null>,
    ) => {
        const new_params = new URLSearchParams({
            ...getSearchParams(false),
        });
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                new_params.delete(key);
            } else {
                new_params.set(key, value);
            }
        });
        current_search_ref.current = Object.fromEntries(new_params);
        history.push({ search: new_params.toString() });
    };

    const updateTableFilter = (table_filter: string) => {
        setTableFilter(table_filter);
        updateSearchParams({ table_filter });
    };

    const updateTableFilterLimit = (table_filter_limit: number) => {
        setTableFilterLimit(table_filter_limit);
        updateSearchParams({ table_filter_limit: String(table_filter_limit) });
    };

    const updateSelectedTables = (selected_tables: SelectedTable[]) => {
        setSelectedTables(selected_tables);
    };

    return (
        <AppContext.Provider
            value={{
                me,
                is_loading,
                project,
                updateProject,
                connection,
                updateDbConnection,
                getSearchParams,
                updateSearchParams,
                table_filter,
                updateTableFilter,
                table_filter_limit,
                updateTableFilterLimit,
                selected_tables,
                updateSelectedTables,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error(
            'useAppContext must be used within an AppContextProvider',
        );
    }
    return context;
};

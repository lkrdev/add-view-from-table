import { Box, Heading } from '@looker/components';
import React, { useEffect, useRef, useState } from 'react';
import { useBoolean } from 'usehooks-ts';
import { useAppContext } from './AppContext';
import ActionBar from './components/ActionBar';
import ConnectionSelect from './components/ConnectionSelect';
import HierarchyExplorer from './components/HierarchyExplorer';
import LkrLoading from './components/LkrLoading';
import ProjectSelect from './components/ProjectSelect';
import { useToast } from './components/Toast/ToastContext';
import useConfigContext from './ConfigContext';
import useSdk from './hooks/useSdk';

const App: React.FC = () => {
    const {
        is_loading,
        me,
        project,
        updateProject,
        connection,
        updateDbConnection,
        selected_tables,
        updateSelectedTables,
    } = useAppContext();
    const initial_wait = useBoolean(true);
    const timeout_ref = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        timeout_ref.current = setTimeout(() => {
            initial_wait.setFalse();
        }, 1000);
        return () => {
            if (timeout_ref.current) {
                clearTimeout(timeout_ref.current);
            }
        };
    }, []);

    const {
        config: { remove_branded_loading, background_color },
    } = useConfigContext();

    const sdk = useSdk();
    const { showSuccess, showError } = useToast();
    const [is_generating, setIsGenerating] = useState(false);

    const handleGenerateLookML = async (create_comments: boolean) => {
        if (selected_tables.length === 0) return;
        setIsGenerating(true);
        try {
            // Group tables by connection
            const by_connection: Record<string, SelectedTable[]> = {};
            selected_tables.forEach((t) => {
                if (!by_connection[t.connection])
                    by_connection[t.connection] = [];
                by_connection[t.connection].push(t);
            });

            for (const [conn, tables] of Object.entries(by_connection)) {
                await sdk.generateLookML({
                    project_id: project,
                    connection: conn,
                    model_name: '',
                    folder_name: 'views',
                    file_type_for_explores: 'none',
                    generate_descriptions: create_comments,
                    generate_helper_text: true,
                    body: {
                        tables: tables.map((t) => ({
                            schema: t.schema || t.database,
                            table_name: t.table_name,
                            base_view: false,
                        })),
                    },
                });
            }

            showSuccess(
                `LookML generation triggered for ${selected_tables.length} table(s)`,
            );
            updateSelectedTables([]);
        } catch (e: any) {
            showError(e.message || 'Failed to generate LookML');
        } finally {
            setIsGenerating(false);
        }
    };

    if (
        is_loading ||
        (initial_wait.value && !Boolean(remove_branded_loading))
    ) {
        return (
            <Box
                height='100vh'
                width='100vw'
                display='flex'
                justifyContent='center'
                alignItems='center'
            >
                {!Boolean(remove_branded_loading) && (
                    <LkrLoading duration={750} />
                )}
            </Box>
        );
    } else if (me) {
        return (
            <Box display='flex' flexDirection='column' height='100vh'>
                {/* Header */}
                <Box
                    p='medium'
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                    zIndex={10}
                >
                    <Box display='flex' alignItems='center'>
                        <Heading as='h2' fontSize='xlarge' fontWeight='bold'>
                            LookML View Generator
                        </Heading>
                    </Box>
                    <Box
                        display='flex'
                        alignItems='center'
                        style={{ gap: '24px' }}
                    >
                        <Box
                            display='flex'
                            alignItems='center'
                            style={{ gap: '8px' }}
                        >
                            <Box width='200px'>
                                <ProjectSelect
                                    value={project}
                                    onChange={updateProject}
                                />
                            </Box>
                        </Box>
                        <Box
                            display='flex'
                            alignItems='center'
                            style={{ gap: '8px' }}
                        >
                            <Box width='200px'>
                                <ConnectionSelect
                                    value={connection}
                                    onChange={updateDbConnection}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Box
                    flex='1'
                    width='100%'
                    style={{
                        overflow: 'hidden',
                    }}
                >
                    <HierarchyExplorer />
                </Box>
                <ActionBar
                    selected_tables={selected_tables}
                    onGenerate={handleGenerateLookML}
                    is_generating={is_generating}
                />
            </Box>
        );
    } else {
        return <Box>Unknown error</Box>;
    }
};

export default App;

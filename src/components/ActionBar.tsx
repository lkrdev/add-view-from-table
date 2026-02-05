import { Box, IconButton, Popover, Space, Text } from '@looker/components';
import { Close, Info } from '@styled-icons/material';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../AppContext';
import LoadingButton from './LoadingButton';

interface ActionBarProps {
    selected_tables: SelectedTable[];
    onGenerate: (create_comments: boolean) => void;
    is_generating?: boolean;
}

const SelectedTableRow = styled(Box)`
    button {
        visibility: hidden;
    }
    &:hover {
        background-color: #f5f6f7;
        button {
            visibility: visible;
        }
    }
`;

const ActionBar: React.FC<ActionBarProps> = ({
    selected_tables,
    onGenerate,
    is_generating,
}) => {
    const { updateSelectedTables } = useAppContext();
    const [create_comments, setCreateComments] = useState(true);

    if (selected_tables.length === 0) return null;

    const handleRemove = (target: SelectedTable) => {
        const isSameTable = (a: SelectedTable, b: SelectedTable) =>
            a.connection === b.connection &&
            a.database === b.database &&
            a.schema === b.schema &&
            a.table_name === b.table_name;

        updateSelectedTables(
            selected_tables.filter((t) => !isSameTable(t, target)),
        );
    };

    return (
        <Box
            p='medium'
            display='flex'
            alignItems='center'
            justifyContent='space-between'
        >
            <Space gap='small'>
                <Text fontWeight='medium'>
                    {selected_tables.length} selected table(s)
                </Text>
                <Popover
                    content={
                        <Box p='medium' maxWidth='400px'>
                            <Box mb='small'>
                                <Text fontWeight='bold'>Selected Tables:</Text>
                            </Box>
                            <Box
                                maxHeight='300px'
                                style={{ overflowY: 'auto' }}
                            >
                                {selected_tables.map((t) => (
                                    <SelectedTableRow
                                        key={`${t.connection}-${t.database}-${t.schema}-${t.table_name}`}
                                        display='flex'
                                        alignItems='center'
                                        justifyContent='space-between'
                                        p='xsmall'
                                        borderRadius='small'
                                    >
                                        <Text
                                            fontSize='xsmall'
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginRight: '8px',
                                            }}
                                        >
                                            {t.connection}:
                                            {t.database ? `${t.database}.` : ''}
                                            {t.schema ? `${t.schema}.` : ''}
                                            {t.table_name}
                                        </Text>
                                        <IconButton
                                            icon={<Close />}
                                            label='Remove'
                                            size='xsmall'
                                            onClick={() => handleRemove(t)}
                                        />
                                    </SelectedTableRow>
                                ))}
                            </Box>
                        </Box>
                    }
                >
                    <IconButton
                        icon={<Info />}
                        label='View selected tables'
                        size='xsmall'
                    />
                </Popover>
            </Space>
            <Box width='200px'>
                <LoadingButton
                    onClick={() => onGenerate(create_comments)}
                    is_loading={!!is_generating}
                    disabled={is_generating}
                >
                    Generate LookML
                </LoadingButton>
            </Box>
        </Box>
    );
};

export default ActionBar;

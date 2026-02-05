import { FieldSelect } from '@looker/components';
import React from 'react';
import useSWR from 'swr';
import useSdk from '../hooks/useSdk';

interface ProjectSelectProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    name?: string;
}

const ProjectSelect: React.FC<ProjectSelectProps> = ({
    value,
    onChange,
    label = 'Project',
    name = 'project_id',
}) => {
    const sdk = useSdk();
    const { data: projects, isLoading: is_loading } = useSWR(
        'all_projects',
        () => sdk.ok(sdk.all_projects()),
    );

    const options =
        projects
            ?.sort((a: any, b: any) =>
                (a.name || a.id || '').localeCompare(b.name || b.id || ''),
            )
            .map((p: any) => ({
                label: p.name || p.id || '',
                value: p.id || '',
                disabled: p.can?.edit === false,
            })) || [];

    return (
        <FieldSelect
            name={name}
            label={label}
            options={options}
            value={value}
            onChange={onChange}
            isLoading={is_loading}
        />
    );
};

export default ProjectSelect;

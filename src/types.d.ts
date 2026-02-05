interface IProjectGeneratorColumn {
    column_name: string;
}

interface IProjectGeneratorTable {
    schema: string;
    table_name: string;
    primary_key?: string;
    base_view?: boolean;
    columns?: IProjectGeneratorColumn[];
}

interface IProjectGenerationSemGenInput {
    user_intention?: string;
    questions?: string;
    user_instructions?: string;
}

interface IProjectGenerationRequest {
    tables?: IProjectGeneratorTable[];
    semantic_generation_input?: IProjectGenerationSemGenInput;
}

interface IGenerateLookMLParameters {
    project_id: string;
    body: IProjectGenerationRequest;
    connection: string;
    model_name: string;
    folder_name: string;
    file_type_for_explores: 'model' | 'explore' | 'none' | string;
    generate_descriptions?: boolean;
    generate_helper_text?: boolean;
}

interface SelectedTable {
    connection: string;
    database: string;
    schema: string;
    table_name: string;
}

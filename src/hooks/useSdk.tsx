import { ExtensionContext } from '@looker/extension-sdk-react';
import { Looker40SDK } from '@looker/sdk';
import { useContext } from 'react';

export default function useSdk() {
    const context = useContext(ExtensionContext);

    if (!context) {
        throw new Error('useSdk must be used within a LookerExtensionProvider');
    }

    const sdk = context.core40SDK as any as Looker40SDK & {
        generateLookML: (params: IGenerateLookMLParameters) => Promise<void>;
    };

    sdk.generateLookML = async (params: IGenerateLookMLParameters) => {
        const { project_id, body, ...queryParams } = params;
        await sdk.ok(
            sdk.authSession.transport.rawRequest(
                'POST',
                `/projects/${encodeURIComponent(project_id)}/generate`,
                queryParams,
                body,
            ) as any,
        );
    };

    return sdk;
}

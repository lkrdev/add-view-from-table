import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useExtensionSdk from "./hooks/useExtensionSdk";

type TConfigContext = {
  config: IExtensionConfig;
  updateConfig: (config: IExtensionConfig) => void;
};

export interface IExtensionConfig extends Record<string, any> {}

export const ConfigContext = createContext<TConfigContext>({} as any);

const useConfigContext: () => TConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error(
      "useConfigContext must be used within a ConfigContextProvider"
    );
  }
  return context;
};

const ConfigContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const extension_sdk = useExtensionSdk();
  const [config_data, setConfigData] = useState<IExtensionConfig>({});

  useEffect(() => {
    const config_data: IExtensionConfig = extension_sdk.getContextData();
    setConfigData(config_data ?? {});
  }, [extension_sdk]);

  // Computed property that provides defaulted boolean values
  const config_data_with_defaults = useMemo(
    () => ({
      ...config_data,
    }),
    [config_data]
  );

  const updateValues = (values: Partial<IExtensionConfig>) => {
    let current: IExtensionConfig = extension_sdk.getContextData() || {};
    for (const [key, value] of Object.entries(values)) {
      const casted_key = key as keyof IExtensionConfig;
      if (value === undefined || value === null || value === "") {
        delete current[casted_key];
      } else {
        current[casted_key] = value as any;
      }
    }
    setConfigData({ ...current });
    extension_sdk.saveContextData(current);
    extension_sdk.refreshContextData();
  };
  return (
    <ConfigContext.Provider
      value={{
        config: config_data_with_defaults,
        updateConfig: updateValues,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export default useConfigContext;
export { ConfigContextProvider };

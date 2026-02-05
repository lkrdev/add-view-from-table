import { Card } from "@looker/components";
import {
  DashboardEvent,
  getEmbedSDK,
  ILookerConnection,
} from "@looker/embed-sdk";
import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { useBoolean } from "usehooks-ts";
import useConfigContext from "./ConfigContext";
import useExtensionSdk from "./hooks/useExtensionSdk";

const StyledCard = styled(Card)<{
  iframe_visible?: boolean;
}>`
  width: 100%;
  height: 100%;
  & > iframe {
    visibility: ${({ iframe_visible }) =>
      iframe_visible ? "visible" : "hidden"};
    width: 100%;
    height: 100%;
  }
`;

const EmbedConnection: React.FC = () => {
  const extension_sdk = useExtensionSdk();
  const { config } = useConfigContext();
  const iframe_visible = useBoolean(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // if there are errors and we dont see dashboard:loaded event, show iframe anyway
    timeoutRef.current = setTimeout(() => {
      iframe_visible.setTrue();
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dashboardRef = useCallback(
    (el: HTMLDivElement) => {
      if (el && !el.children.length) {
        const embed_sdk = getEmbedSDK();
        embed_sdk.init(extension_sdk.lookerHostData?.hostUrl!);

        embed_sdk
          .createDashboardWithId(config.dashboards?.[0])
          .appendTo(el)
          .on("dashboard:loaded", (e: DashboardEvent) => {
            console.log(e);
          })
          .on("page:changed", (event: any) => {
            console.log(event);
          })
          .build()
          .connect()
          .then((connection: ILookerConnection) => {
            console.log(connection);
          })
          .catch((error: any) => {
            console.error("Error embedding dashboard:", error);
          });
      }
    },
    [extension_sdk, config.dashboards?.[0]]
  );
  return (
    <StyledCard
      raised
      borderRadius="large"
      ref={dashboardRef}
      iframe_visible={iframe_visible.value}
    />
  );
};

export default EmbedConnection;

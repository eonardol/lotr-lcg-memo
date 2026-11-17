import { createContext, useContext, type ReactNode } from "react";

const PortalContainerContext = createContext<HTMLElement | null>(null);

export const PortalContainerProvider = ({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) => (
  <PortalContainerContext.Provider value={value}>{children}</PortalContainerContext.Provider>
);

export const usePortalContainer = () => useContext(PortalContainerContext);

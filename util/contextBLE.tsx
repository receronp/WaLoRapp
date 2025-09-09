import React, { createContext, useContext } from "react";
import useBLE from "@/util/useBLE";

type BLEContextType = ReturnType<typeof useBLE>;

const BLEContext = createContext<BLEContextType | undefined>(undefined);

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ble = useBLE();
  return <BLEContext.Provider value={ble}>{children}</BLEContext.Provider>;
};

export const useBLEContext = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error("useBLEContext must be used within a BLEProvider");
  }
  return context;
};

import { createContext, useContext } from "react";

interface ReadOnlyContextValue {
  isReadOnly: boolean;
  isSharedUser: boolean;
}

const ReadOnlyContext = createContext<ReadOnlyContextValue>({
  isReadOnly: false,
  isSharedUser: false,
});

export function ReadOnlyProvider({
  children,
  isReadOnly,
  isSharedUser = false,
}: {
  children: React.ReactNode;
  isReadOnly: boolean;
  isSharedUser?: boolean;
}) {
  return (
    <ReadOnlyContext.Provider value={{ isReadOnly, isSharedUser }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

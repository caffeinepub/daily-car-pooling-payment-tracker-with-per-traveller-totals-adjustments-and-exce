import { createContext, useContext } from "react";

interface ReadOnlyContextValue {
  isReadOnly: boolean;
}

const ReadOnlyContext = createContext<ReadOnlyContextValue>({
  isReadOnly: false,
});

export function ReadOnlyProvider({
  children,
  isReadOnly,
}: {
  children: React.ReactNode;
  isReadOnly: boolean;
}) {
  return (
    <ReadOnlyContext.Provider value={{ isReadOnly }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

import { createContext, useCallback, useContext, useEffect, useRef, ReactNode } from "react";

type OpenFn = () => void;

interface HeaderScooterDropdownContextValue {
  registerOpener: (fn: OpenFn | null) => void;
  open: () => void;
}

const HeaderScooterDropdownContext = createContext<HeaderScooterDropdownContextValue | null>(null);

export const HeaderScooterDropdownProvider = ({ children }: { children: ReactNode }) => {
  const openerRef = useRef<OpenFn | null>(null);

  const registerOpener = useCallback((fn: OpenFn | null) => {
    openerRef.current = fn;
  }, []);

  const open = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (openerRef.current) {
      const fn = openerRef.current;
      window.setTimeout(() => fn(), 350);
    }
  }, []);

  return (
    <HeaderScooterDropdownContext.Provider value={{ registerOpener, open }}>
      {children}
    </HeaderScooterDropdownContext.Provider>
  );
};

export const useHeaderScooterDropdown = () => {
  const ctx = useContext(HeaderScooterDropdownContext);
  return {
    open: ctx?.open ?? (() => {}),
  };
};

export const useHeaderScooterDropdownRegistration = (fn: OpenFn) => {
  const ctx = useContext(HeaderScooterDropdownContext);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!ctx) return;
    const stable: OpenFn = () => fnRef.current();
    ctx.registerOpener(stable);
    return () => {
      ctx.registerOpener(null);
    };
  }, [ctx]);
};

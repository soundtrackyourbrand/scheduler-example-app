import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

type MusicLibraryContext = {
  libraryId: string | null;
  setLibraryId: (value: string) => void;
};

const musicLibraryContext = createContext<MusicLibraryContext>({
  libraryId: null,
  setLibraryId() {
    throw new Error("default context");
  },
});

const libraryIdKey = "library.id";

function get(key: string): string | null {
  return window.localStorage.getItem(key);
}

function set(key: string, value: string) {
  window.localStorage.setItem(key, value);
}

export function MusicLibraryProvider(props: PropsWithChildren) {
  const [libraryId, setLibraryId] = useState<string | null>(null);

  useEffect(() => {
    setLibraryId(get(libraryIdKey));
  }, []);

  const state: MusicLibraryContext = {
    libraryId,
    setLibraryId(value: string) {
      setLibraryId(value);
      set(libraryIdKey, value);
    },
  };

  return (
    <musicLibraryContext.Provider value={state}>
      {props.children}
    </musicLibraryContext.Provider>
  );
}

export function useMusicLibrary(): MusicLibraryContext {
  const v = useContext(musicLibraryContext);
  return v;
}

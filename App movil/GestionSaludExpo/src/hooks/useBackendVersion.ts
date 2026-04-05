import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config/api";

export type BackendVersionResponse = {
  name: string;
  description: string;
  version: string;
  semver: {
    major: number;
    minor: number;
    patch: number;
    prerelease: string | null;
  };
  apiVersion: string;
  buildDate: string;
};

type State = {
  backendVersion: BackendVersionResponse | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: State = {
  backendVersion: null,
  isLoading: false,
  error: null,
};

export function useBackendVersion() {
  const [state, setState] = useState<State>(initialState);

  const fetchVersion = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${API_URL}/version`);
      if (!response.ok) {
        throw new Error(`Version request failed (${response.status})`);
      }
      const payload = (await response.json()) as BackendVersionResponse;
      setState({ backendVersion: payload, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error obteniendo version backend';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    fetchVersion();
  }, [fetchVersion]);

  return {
    backendVersion: state.backendVersion,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchVersion,
  };
}

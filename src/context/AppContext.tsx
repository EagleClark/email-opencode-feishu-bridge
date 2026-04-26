import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { EmailConfig, StoredEmail, MonitorStatus, ElectronAPI, LogEntry } from '../types';

interface AppState {
  emails: StoredEmail[];
  config: EmailConfig | null;
  monitorStatus: MonitorStatus;
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_EMAILS'; payload: StoredEmail[] }
  | { type: 'ADD_EMAIL'; payload: StoredEmail }
  | { type: 'MARK_ACKED'; payload: number }
  | { type: 'SET_CONFIG'; payload: EmailConfig | null }
  | { type: 'SET_MONITOR_STATUS'; payload: MonitorStatus }
  | { type: 'SET_LOGS'; payload: LogEntry[] }
  | { type: 'ADD_LOG'; payload: LogEntry }
  | { type: 'LOG_CLEARED' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface AppContextValue {
  state: AppState;
  saveConfig: (config: EmailConfig) => Promise<void>;
  validateConfig: (config: EmailConfig) => Promise<{ valid: boolean; error?: string }>;
  testOpenCode: (host: string, port: number) => Promise<{ valid: boolean; error?: string }>;
  refreshEmails: () => Promise<void>;
  markAcked: (uid: number) => Promise<void>;
  startMonitor: () => Promise<void>;
  stopMonitor: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

const defaultStatus: MonitorStatus = {
  running: false,
  connected: false,
  lastChecked: null,
  lastError: null,
  monitoredSenders: [],
};

const initialState: AppState = {
  emails: [],
  config: null,
  monitorStatus: defaultStatus,
  logs: [],
  loading: true,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_EMAILS':
      return { ...state, emails: action.payload };
    case 'ADD_EMAIL':
      if (state.emails.some(e => e.uid === action.payload.uid)) {
        return state;
      }
      return { ...state, emails: [action.payload, ...state.emails] };
    case 'MARK_ACKED':
      return {
        ...state,
        emails: state.emails.map(e =>
          e.uid === action.payload ? { ...e, acked: true } : e,
        ),
      };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_MONITOR_STATUS':
      return { ...state, monitorStatus: action.payload };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    case 'LOG_CLEARED':
      return { ...state, logs: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | null>(null);

function getAPI(): ElectronAPI {
  const api = window.electronAPI;
  if (!api) {
    throw new Error('electronAPI not available (not running in Electron?)');
  }
  return api;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const unsubRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const [config, emails, status, logs] = await Promise.all([
          getAPI().getConfig(),
          getAPI().getEmails(),
          getAPI().getMonitorStatus(),
          getAPI().getLogs(),
        ]);
        dispatch({ type: 'SET_CONFIG', payload: config });
        dispatch({ type: 'SET_EMAILS', payload: emails });
        dispatch({ type: 'SET_MONITOR_STATUS', payload: status });
        dispatch({ type: 'SET_LOGS', payload: logs });
      } catch (err: any) {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  useEffect(() => {
    const api = getAPI();
    const cleanups: (() => void)[] = [];

    cleanups.push(
      api.onNewEmail((email) => {
        dispatch({ type: 'ADD_EMAIL', payload: email });
      }),
    );

    cleanups.push(
      api.onMonitorError((error) => {
        dispatch({ type: 'SET_ERROR', payload: error });
      }),
    );

    cleanups.push(
      api.onNewLog((log) => {
        dispatch({ type: 'ADD_LOG', payload: log });
      }),
    );

    // Poll status every 5s (monitor:status is also pushed from engine)
    const interval = setInterval(async () => {
      try {
        const status = await api.getMonitorStatus();
        dispatch({ type: 'SET_MONITOR_STATUS', payload: status });
      } catch { /* ignore */ }
    }, 5000);

    unsubRef.current = cleanups;

    return () => {
      cleanups.forEach(fn => fn());
      clearInterval(interval);
    };
  }, []);

  const saveConfig = useCallback(async (config: EmailConfig) => {
    await getAPI().saveConfig(config);
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const validateConfig = useCallback(async (config: EmailConfig) => {
    return getAPI().validateConfig(config);
  }, []);

  const testOpenCode = useCallback(async (host: string, port: number) => {
    return getAPI().testOpenCode(host, port);
  }, []);

  const refreshEmails = useCallback(async () => {
    const emails = await getAPI().getEmails();
    dispatch({ type: 'SET_EMAILS', payload: emails });
  }, []);

  const markAcked = useCallback(async (uid: number) => {
    await getAPI().markEmailAcked(uid);
    dispatch({ type: 'MARK_ACKED', payload: uid });
  }, []);

  const startMonitor = useCallback(async () => {
    await getAPI().startMonitor();
    const status = await getAPI().getMonitorStatus();
    dispatch({ type: 'SET_MONITOR_STATUS', payload: status });
  }, []);

  const stopMonitor = useCallback(async () => {
    await getAPI().stopMonitor();
    const status = await getAPI().getMonitorStatus();
    dispatch({ type: 'SET_MONITOR_STATUS', payload: status });
  }, []);

  const refreshStatus = useCallback(async () => {
    const status = await getAPI().getMonitorStatus();
    dispatch({ type: 'SET_MONITOR_STATUS', payload: status });
  }, []);

  const refreshLogs = useCallback(async () => {
    const logs = await getAPI().getLogs();
    dispatch({ type: 'SET_LOGS', payload: logs });
  }, []);

  const clearLogs = useCallback(async () => {
    await getAPI().clearLogs();
    dispatch({ type: 'LOG_CLEARED' });
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      saveConfig,
      validateConfig,
      testOpenCode,
      refreshEmails,
      markAcked,
      startMonitor,
      stopMonitor,
      refreshStatus,
      refreshLogs,
      clearLogs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}

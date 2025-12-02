 'use client';
import { useEffect, useState } from 'react';
import styles from './SettingsBar.module.css';
import { useSettingsStore } from '../store/settings';

export function SettingsBar() {
  const { apiBaseUrl, adminToken, setApiBaseUrl, setAdminToken, hydrate } = useSettingsStore();
  const [baseUrlInput, setBaseUrlInput] = useState(apiBaseUrl);
  const [tokenInput, setTokenInput] = useState(adminToken);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setBaseUrlInput(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    setTokenInput(adminToken);
  }, [adminToken]);

  return (
    <div className={styles.bar}>
      <div className={styles.fieldGroup}>
        <label htmlFor="apiBase">API Base URL</label>
        <input
          id="apiBase"
          value={baseUrlInput}
          onChange={(e) => setBaseUrlInput(e.target.value)}
        onBlur={() => setApiBaseUrl(baseUrlInput.trim())}
        placeholder="https://api.staging.example.com"
      />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="token">Admin Token</label>
        <input
          id="token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onBlur={() => setAdminToken(tokenInput.trim())}
          placeholder="Bearer token"
          type="password"
        />
      </div>
      <div className={styles.helper}>
        <p>Gunakan token ADMIN staging/dev saja. Nilai tersimpan lokal (localStorage).</p>
      </div>
    </div>
  );
}

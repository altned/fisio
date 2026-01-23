'use client';
import { useEffect, useState } from 'react';
import styles from './SettingsBar.module.css';
import { useSettingsStore, API_BASE_URL } from '../store/settings';

export function SettingsBar() {
  const { adminToken, setAdminToken, hydrate } = useSettingsStore();
  const [tokenInput, setTokenInput] = useState(adminToken);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setTokenInput(adminToken);
  }, [adminToken]);

  return (
    <div className={styles.bar}>
      <div className={styles.fieldGroup}>
        <label htmlFor="apiBase">API Base URL</label>
        <input
          id="apiBase"
          value={API_BASE_URL}
          disabled
          placeholder="Set via NEXT_PUBLIC_API_BASE_URL env"
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

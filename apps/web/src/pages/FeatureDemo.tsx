import React, { useState } from 'react';
import { apiFetch } from '../lib/apiClient';

export default function FeatureDemoPage() {
  const [flagKey, setFlagKey] = useState('sample-flag');
  const [flagEnabled, setFlagEnabled] = useState<string>('unknown');
  const [flagRawValue, setFlagRawValue] = useState<string>('');
  const [emailTo, setEmailTo] = useState('test@example.com');
  const [message, setMessage] = useState('');
  const [uploadInfo, setUploadInfo] = useState<string>('');

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="rounded border p-4 space-y-3">
        <h3 className="font-semibold">Check feature flag</h3>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 w-full"
            value={flagKey}
            onChange={(e) => setFlagKey(e.target.value)}
          />
          <button
            className="bg-black text-white px-3 py-1 rounded"
            onClick={async () => {
              const res = await apiFetch(`/api/v1/flags/${encodeURIComponent(flagKey)}`);
              if (res.ok) {
                const json = (await res.json()) as { enabled: boolean; value?: unknown };
                setFlagEnabled(String(json.enabled));
                setFlagRawValue(json.value === undefined ? '' : JSON.stringify(json.value));
              } else {
                setFlagEnabled('error');
                setFlagRawValue('');
              }
            }}
          >
            Check
          </button>
        </div>
        <div className="text-sm">
          <p>Enabled: {flagEnabled}</p>
          {flagRawValue && <p>Value: {flagRawValue}</p>}
        </div>
      </div>

      <div className="rounded border p-4 space-y-3">
        <h3 className="font-semibold">Send test email</h3>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 w-full"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <button
            className="bg-black text-white px-3 py-1 rounded"
            onClick={async () => {
              const res = await apiFetch('/api/v1/test-email', {
                method: 'POST',
                body: JSON.stringify({ to: emailTo, template: 'new-device-login' }),
              });
              setMessage(res.ok ? 'Sent' : `Error ${res.status}`);
            }}
          >
            Send
          </button>
        </div>
        {message && <p className="text-sm">{message}</p>}
      </div>

      <div className="rounded border p-4 space-y-3">
        <h3 className="font-semibold">Presigned upload (S3-compatible)</h3>
        <button
          className="bg-black text-white px-3 py-1 rounded"
          onClick={async () => {
            const key = `demo/${Date.now()}.txt`;
            const presign = await apiFetch('/api/v1/storage/presign-upload', {
              method: 'POST',
              body: JSON.stringify({ key, contentType: 'text/plain' }),
            });
            if (!presign.ok) {
              setUploadInfo(`Error presigning: ${presign.status}`);
              return;
            }
            const { url } = (await presign.json()) as { url: string };
            const putRes = await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'text/plain' },
              body: 'Hello from demo upload',
            });
            setUploadInfo(putRes.ok ? `Uploaded to key ${key}` : `Upload error ${putRes.status}`);
          }}
        >
          Presign & Upload sample file
        </button>
        {uploadInfo && <p className="text-sm">{uploadInfo}</p>}
      </div>
    </section>
  );
}

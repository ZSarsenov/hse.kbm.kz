import { useState, useCallback } from 'react';

type NCALayerMethod = 'signXml' | 'signXmls'; // Можно расширять методы

interface NCALayerResponse {
  code: string;
  message: string;
  responseObject?: string; // Подписанный XML или результат
  result?: any;
}

export const useNCALayer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback((method: NCALayerMethod, args: any[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      const socket = new WebSocket('wss://127.0.0.1:13579/');
      let isResolved = false;

      socket.onopen = () => {
        console.log('✅ NCALayer Connected');
        const request = {
          "module": "kz.gov.pki.knca.commonUtils",
          "method": method,
          "args": args
        };
        socket.send(JSON.stringify(request));
      };

      socket.onmessage = (event) => {
        const data: NCALayerResponse = JSON.parse(event.data);
        console.log('📩 NCALayer Response:', data);

        isResolved = true;
        setLoading(false);
        socket.close();

        if (data.code === '200' && data.responseObject) {
          resolve(data.responseObject);
        } else {
          const errMsg = data.message || 'Ошибка NCALayer или отмена операции';
          setError(errMsg);
          reject(new Error(errMsg));
        }
      };

      socket.onerror = (err) => {
        if (!isResolved) {
          console.error('❌ NCALayer Error:', err);
          setLoading(false);
          setError('Ошибка подключения к NCALayer. Убедитесь, что приложение запущено.');
          reject(err);
        }
      };

      socket.onclose = () => {
        if (!isResolved) {
          setLoading(false);
          // Если сокет закрылся раньше ответа (например, таймаут)
          // Но обычно onmessage успевает сработать
        }
      };
    });
  }, []);

  return { execute, loading, error };
};
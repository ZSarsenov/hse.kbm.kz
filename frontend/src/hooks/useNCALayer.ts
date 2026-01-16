import { useState, useCallback } from 'react';

type NCALayerMethod = 'signXml' | 'signXmls';

interface NCALayerResponse {
  code?: string | number;
  message?: string;
  responseObject?: string;
  result?: {
      code?: string | number;
      message?: string;
      responseObject?: string;
      version?: string; // 👈 Добавили поле версии
  };
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
        console.log('📩 NCALayer Raw Response:', event.data);

        let data: NCALayerResponse;
        try {
            data = JSON.parse(event.data);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return;
        }

        // 👇 ВАЖНО: Игнорируем приветственное сообщение с версией
        if (data.result && data.result.version) {
            console.log(`ℹ️ NCALayer Version: ${data.result.version}. Ждем ответ на команду...`);
            return; // Не закрываем сокет, ждем следующее сообщение!
        }

        // Если это не версия, значит это ответ на наш запрос
        isResolved = true;
        setLoading(false);
        socket.close();

        // Извлекаем данные
        const code = data.code || (data.result && data.result.code);
        const responseObject = data.responseObject || (data.result && data.result.responseObject);
        const message = data.message || (data.result && data.result.message);

        // Проверяем успех (код может быть строкой "200" или числом 200)
        if (code === '200' || code === 200) {
          if (responseObject) {
            resolve(responseObject);
          } else {
            reject(new Error("NCALayer вернул успех (200), но подпись пустая."));
          }
        } else {
          // Если пользователь нажал "Отмена", кода не будет, или он будет не 200
          const errMsg = message || 'Ошибка NCALayer или отмена операции';
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
        }
      };
    });
  }, []);

  return { execute, loading, error };
};
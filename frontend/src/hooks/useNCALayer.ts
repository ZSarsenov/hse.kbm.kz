import { useState } from 'react';

export const useNCALayer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Универсальная функция: принимает имя метода и список аргументов
  const execute = async (method: string, args: any[]) => {
    setLoading(true);
    setError(null);

    return new Promise<string>((resolve, reject) => {
      const socket = new WebSocket('wss://127.0.0.1:13579/');

      socket.onopen = () => {
        const request = {
          "module": "kz.gov.pki.knca.commonUtils",
          "method": method,
          "args": args
        };
        console.log(`📡 Отправка в NCALayer (${method}):`, args);
        socket.send(JSON.stringify(request));
      };

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // Игнорируем сообщение о версии
        if (response.result && response.result.version) {
            return;
        }

        console.log("🔥 Ответ NCALayer:", response);
        socket.close();

        if (response.code === "200" && response.responseObject) {
          resolve(response.responseObject);
        } else {
          const msg = response.message || `Ошибка (Code: ${response.code})`;
          setError(msg);
          reject(msg);
        }
        setLoading(false);
      };

      socket.onerror = (err) => {
        console.error(err);
        setError("NCALayer не запущен.");
        setLoading(false);
        reject("Ошибка соединения");
      };
    });
  };

  return { execute, loading, error };
};
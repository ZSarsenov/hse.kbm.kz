import { useState, useCallback } from 'react';

const SOCKET_URL = 'wss://127.0.0.1:13579/';

let wsConnection: WebSocket | null = null;
let wsConnecting: Promise<string> | null = null;
let versionHandled = false;

function connectToNCALayer(): Promise<string> {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN && versionHandled) {
    return Promise.resolve('connected');
  }

  if (wsConnecting) {
    return wsConnecting;
  }

  wsConnecting = new Promise<string>((resolve, reject) => {
    const ws = new WebSocket(SOCKET_URL);
    versionHandled = false;

    ws.onopen = () => {
      wsConnection = ws;
    };

    ws.onmessage = (msg) => {
      if (versionHandled) return;
      try {
        const response = JSON.parse(msg.data);
        if (response.result && response.result.version) {
          versionHandled = true;
          wsConnecting = null;
          resolve(response.result.version);
        }
      } catch {}
    };

    ws.onerror = () => {
      wsConnection = null;
      wsConnecting = null;
      versionHandled = false;
      reject(new Error('Ошибка подключения к NCALayer. Убедитесь, что приложение запущено.'));
    };

    ws.onclose = () => {
      wsConnection = null;
      wsConnecting = null;
      versionHandled = false;
    };
  });

  return wsConnecting;
}

export const useNCALayer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signXml = useCallback((
    xmlToSign: string,
    _signerIIN?: string,
    _signerBIN?: string,
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      setLoading(true);
      setError(null);

      try {
        await connectToNCALayer();
      } catch (e: any) {
        setLoading(false);
        setError(e.message);
        reject(e);
        return;
      }

      const ws = wsConnection!;
      let responseProcessed = false;

      ws.onmessage = (event) => {
        if (responseProcessed) return;

        let response: any;
        try {
          response = JSON.parse(event.data);
        } catch {
          return;
        }

        if (response.result && response.result.version) return;

        responseProcessed = true;
        setLoading(false);

        if (response.hasOwnProperty('status')) {
          if (response.status === true) {
            if (response.body && response.body.hasOwnProperty('result')) {
              let result = response.body.result;
              console.log('NCALayer basics result type:', typeof result, result);

              if (typeof result === 'string') {
                resolve(result);
              } else if (Array.isArray(result)) {
                resolve(result[0]);
              } else if (result && result.signatures) {
                const sig = Array.isArray(result.signatures) ? result.signatures[0] : result.signatures;
                resolve(sig);
              } else {
                resolve(JSON.stringify(result));
              }
            } else {
              const err = new Error('Подписание отменено пользователем.');
              setError(err.message);
              reject(err);
            }
          } else {
            const errMsg = `${response.code || 'ERROR'}: ${response.message || 'Ошибка NCALayer'}`;
            setError(errMsg);
            reject(new Error(errMsg));
          }
          return;
        }

        const code = response.code || (response.result && response.result.code);
        const responseObject = response.responseObject || (response.result && response.result.responseObject);
        const message = response.message || (response.result && response.result.message);
        if (code === '200' || code === 200) {
          resolve(responseObject || '');
        } else {
          const errMsg = (message || 'Ошибка NCALayer') as string;
          setError(errMsg);
          reject(new Error(errMsg));
        }
      };

      ws.onerror = () => {
        if (responseProcessed) return;
        responseProcessed = true;
        setLoading(false);
        wsConnection = null;
        versionHandled = false;
        const msg = 'Ошибка взаимодействия с NCALayer.';
        setError(msg);
        reject(new Error(msg));
      };

      ws.onclose = () => {
        wsConnection = null;
        versionHandled = false;
        if (responseProcessed) return;
        responseProcessed = true;
        setLoading(false);
        const msg = 'NCALayer закрыл соединение.';
        setError(msg);
        reject(new Error(msg));
      };

      const request = {
        module: 'kz.gov.pki.knca.basics',
        method: 'sign',
        args: {
          allowedStorages: ['PKCS12'],
          format: 'xml',
          data: xmlToSign,
          signingParams: {},
          signerParams: {
            extKeyUsageOids: [],
          },
          locale: 'ru',
        },
      };

      ws.send(JSON.stringify(request));
    });
  }, []);

  const execute = useCallback((_method: string, args: any[]): Promise<string> => {
    const xmlToSign = args[2] || '';
    return signXml(xmlToSign);
  }, [signXml]);

  return { execute, signXml, loading, error };
};

import { toast } from 'sonner';

// WebSocket connection management
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
const messageListeners: ((data: any) => void)[] = [];

export function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts = 0;
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          reconnectAttempts++;
          connectWebSocket();
        }, RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1));
      } else {
        toast.error('Lost connection to server. Please refresh the page.');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please check your internet connection.');
    };

  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    toast.error('Failed to establish connection. Please try again later.');
  }
}

export function sendWSMessage(type: string, data: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectWebSocket();
    setTimeout(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    }, 1000);
    return;
  }

  try {
    ws.send(JSON.stringify({ type, data }));
  } catch (error) {
    console.error('Failed to send WebSocket message:', error);
    toast.error('Failed to send message. Please try again.');
  }
}

export function addWSListener(callback: (data: any) => void) {
  if (!ws) {
    connectWebSocket();
  }

  const messageHandler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws?.addEventListener('message', messageHandler);

  return () => {
    ws?.removeEventListener('message', messageHandler);
  };
}

// Automatically try to connect when this module is imported
connectWebSocket();
// Helper function to get the WebSocket URL
function getWebSocketUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
}

type ProgressCallback = (message: string, progress: number) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private callbacks: ProgressCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private analysisId: string | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(analysisId: string): void {
    if (this.socket && this.analysisId === analysisId && this.isConnected) {
      return; // Already connected to this analysis
    }

    this.disconnect(); // Close any existing connection
    this.analysisId = analysisId;
    
    const wsUrl = getWebSocketUrl(`/api/ws/status/${analysisId}`);
    
    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress_update') {
          this.notifyCallbacks(data.message, data.progress);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      if (this.analysisId) {
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.analysisId) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.analysisId) {
        this.connect(this.analysisId);
      }
    }, delay);
  }

  public subscribe(callback: ProgressCallback): void {
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
    }
  }

  public unsubscribe(callback: ProgressCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private notifyCallbacks(message: string, progress: number): void {
    this.callbacks.forEach(callback => {
      try {
        callback(message, progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.analysisId = null;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = WebSocketService.getInstance();

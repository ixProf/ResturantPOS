import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;

  public async startConnection(): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    const token = localStorage.getItem('alaris_token');

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/order', {
        accessTokenFactory: () => token || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      console.log('SignalR OrderHub Connected');
    } catch (err) {
      console.warn('SignalR Connection Error:', err);
    }

    return this.connection;
  }

  public async joinGroup(groupName: string) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinGroup', groupName);
      } catch (err) {
        console.warn('Error joining group:', err);
      }
    }
  }

  public async leaveGroup(groupName: string) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveGroup', groupName);
      } catch (err) {
        console.warn('Error leaving group:', err);
      }
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    if (this.connection) {
      this.connection.on(eventName, callback);
    }
  }

  public off(eventName: string, callback?: (...args: any[]) => void) {
    if (this.connection) {
      if (callback) {
        this.connection.off(eventName, callback);
      } else {
        this.connection.off(eventName);
      }
    }
  }

  public stopConnection() {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }
}

export const signalRService = new SignalRService();

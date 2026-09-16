import type { Response } from 'express';

interface RealtimeClient {
  userId: string;
  res: Response;
}

class RealtimeService {
  private clients: Map<string, Set<Response>> = new Map();

  public registerClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);

    // Heartbeat every 25 seconds
    const interval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (err) {
        clearInterval(interval);
        this.removeClient(userId, res);
      }
    }, 25000);

    res.on('close', () => {
      clearInterval(interval);
      this.removeClient(userId, res);
    });
  }

  public removeClient(userId: string, res: Response): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  public emitToUser(userId: string, event: string, data: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data
    });

    const msg = `event: ${event}\ndata: ${payload}\n\n`;
    for (const client of userClients) {
      try {
        client.write(msg);
      } catch (err) {
        userClients.delete(client);
      }
    }
  }

  public broadcast(event: string, data: any): void {
    const payload = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data
    });
    const msg = `event: ${event}\ndata: ${payload}\n\n`;

    for (const [userId, clientSet] of this.clients.entries()) {
      for (const client of clientSet) {
        try {
          client.write(msg);
        } catch (err) {
          clientSet.delete(client);
        }
      }
    }
  }
}

export const realtimeService = new RealtimeService();

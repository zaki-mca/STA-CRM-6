import { checkHealth } from '../db';

/**
 * Simple server health monitoring system
 * This handles checking critical services and reporting issues
 */
class ServerMonitor {
  private isHealthy: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly listeners: Array<(isHealthy: boolean) => void> = [];

  /**
   * Start the monitoring service
   * @param intervalMs Time between health checks in milliseconds
   */
  start(intervalMs: number = 30000) {
    if (this.checkInterval) {
      return; // Already running
    }

    console.log(`Starting server monitoring (check interval: ${intervalMs}ms)`);
    
    // Run initial check immediately
    this.checkHealth();
    
    // Set up recurring checks
    this.checkInterval = setInterval(() => this.checkHealth(), intervalMs);
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Server monitoring stopped');
    }
  }

  /**
   * Check the health of critical services
   */
  private async checkHealth() {
    try {
      // Check database connectivity
      const dbHealth = await checkHealth();
      
      if (!dbHealth.healthy) {
        this.reconnectAttempts++;
        console.error(`Database connection check failed: ${dbHealth.details}. Attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`);
        
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          this.setHealthStatus(false);
          console.error('Maximum reconnection attempts reached. Server health status set to unhealthy.');
        }
      } else {
        // Reset reconnect counter on successful check
        if (this.reconnectAttempts > 0) {
          console.log('Database connection restored');
          this.reconnectAttempts = 0;
        }
        
        this.setHealthStatus(true);
      }
    } catch (error) {
      console.error('Error during health check:', error);
      this.setHealthStatus(false);
    }
  }

  /**
   * Update health status and notify listeners if changed
   */
  private setHealthStatus(isHealthy: boolean) {
    if (this.isHealthy !== isHealthy) {
      this.isHealthy = isHealthy;
      console.log(`Server health status changed to: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      
      // Notify all registered listeners
      this.listeners.forEach(listener => {
        try {
          listener(isHealthy);
        } catch (e) {
          console.error('Error in health status listener:', e);
        }
      });
    }
  }

  /**
   * Register a listener for health status changes
   */
  onHealthChange(listener: (isHealthy: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current health status
   */
  getHealthStatus(): boolean {
    return this.isHealthy;
  }
}

// Export singleton instance
export const serverMonitor = new ServerMonitor();

// Export types
export type HealthStatus = {
  healthy: boolean;
  services: {
    database: boolean;
    api: boolean;
  };
  uptime: number;
  lastChecked: Date;
}; 
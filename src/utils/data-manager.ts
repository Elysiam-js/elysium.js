/**
 * Data Manager for ElysiumJS
 * Provides state management and data persistence utilities
 */

import fs from 'fs';
import path from 'path';
import { ElysiumError } from './error-handler.js';

/**
 * Interface for event listeners
 */
interface EventListeners {
  [event: string]: Array<(data: any) => void>;
}

/**
 * Interface for state object
 */
interface StateObject {
  [key: string]: any;
}

/**
 * Interface for state change event
 */
interface StateChangeEvent {
  oldState: StateObject;
  newState: StateObject;
}

/**
 * Interface for key change event
 */
interface KeyChangeEvent {
  oldValue: any;
  newValue: any;
}

/**
 * Interface for persistence options
 */
interface PersistenceOptions {
  dataDir?: string;
  format?: string;
  [key: string]: any;
}

/**
 * Interface for data manager options
 */
interface DataManagerOptions {
  initialState?: StateObject;
  persistence?: PersistenceOptions;
}

/**
 * Simple event emitter for data changes
 */
class EventEmitter {
  protected events: EventListeners;

  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  on(event: string, listener: (data: any) => void): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(l => l !== listener);
    };
  }

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data: any): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }
}

/**
 * Data store for managing application state
 */
export class Store extends EventEmitter {
  private state: StateObject;

  constructor(initialState: StateObject = {}) {
    super();
    this.state = { ...initialState };
  }

  /**
   * Get the current state
   * @returns Current state
   */
  getState(): StateObject {
    return { ...this.state };
  }

  /**
   * Update the state
   * @param update - State update
   */
  setState(update: StateObject): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...update };
    
    // Emit change events
    this.emit('change', { oldState, newState: this.state });
    
    for (const key in update) {
      if (Object.prototype.hasOwnProperty.call(update, key)) {
        this.emit(`change:${key}`, { 
          oldValue: oldState[key], 
          newValue: this.state[key] 
        });
      }
    }
  }

  /**
   * Subscribe to state changes
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: StateChangeEvent) => void): () => void {
    return this.on('change', listener);
  }

  /**
   * Subscribe to changes of a specific key
   * @param key - State key
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  subscribeToKey(key: string, listener: (event: KeyChangeEvent) => void): () => void {
    return this.on(`change:${key}`, listener);
  }
}

/**
 * Data persistence manager for storing data to disk
 */
export class PersistenceManager {
  private options: PersistenceOptions;

  constructor(options: PersistenceOptions = {}) {
    this.options = {
      dataDir: './data',
      format: 'json',
      ...options
    };
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.options.dataDir!)) {
      fs.mkdirSync(this.options.dataDir!, { recursive: true });
    }
  }

  /**
   * Get the file path for a collection
   * @param collection - Collection name
   * @returns File path
   */
  getFilePath(collection: string): string {
    return path.join(this.options.dataDir!, `${collection}.${this.options.format}`);
  }

  /**
   * Save data to a collection
   * @param collection - Collection name
   * @param data - Data to save
   * @returns Promise that resolves when data is saved
   */
  async save(collection: string, data: any): Promise<void> {
    try {
      const filePath = this.getFilePath(collection);
      const serializedData = JSON.stringify(data, null, 2);
      
      await fs.promises.writeFile(filePath, serializedData, 'utf-8');
    } catch (error: any) {
      throw new ElysiumError(
        `Failed to save data to collection '${collection}'`,
        'DATA_SAVE_ERROR',
        { collection, error: error.message }
      );
    }
  }

  /**
   * Load data from a collection
   * @param collection - Collection name
   * @returns Promise that resolves with the loaded data
   */
  async load(collection: string): Promise<any> {
    try {
      const filePath = this.getFilePath(collection);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      throw new ElysiumError(
        `Failed to load data from collection '${collection}'`,
        'DATA_LOAD_ERROR',
        { collection, error: error.message }
      );
    }
  }

  /**
   * Delete a collection
   * @param collection - Collection name
   * @returns Promise that resolves when collection is deleted
   */
  async delete(collection: string): Promise<void> {
    try {
      const filePath = this.getFilePath(collection);
      
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error: any) {
      throw new ElysiumError(
        `Failed to delete collection '${collection}'`,
        'DATA_DELETE_ERROR',
        { collection, error: error.message }
      );
    }
  }

  /**
   * List all collections
   * @returns Promise that resolves with collection names
   */
  async listCollections(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.options.dataDir!);
      return files
        .filter(file => file.endsWith(`.${this.options.format}`))
        .map(file => file.replace(`.${this.options.format}`, ''));
    } catch (error: any) {
      throw new ElysiumError(
        'Failed to list collections',
        'DATA_LIST_ERROR',
        { error: error.message }
      );
    }
  }
}

/**
 * Interface for data manager
 */
interface DataManager {
  store: Store;
  persistence: PersistenceManager;
  createStore: (initialState?: StateObject) => Store;
}

/**
 * Create a data manager for ElysiumJS
 * @param options - Data manager options
 * @returns Data manager
 */
export function createDataManager(options: DataManagerOptions = {}): DataManager {
  const store = new Store(options.initialState || {});
  const persistenceManager = new PersistenceManager(options.persistence || {});
  
  return {
    store,
    persistence: persistenceManager,
    
    /**
     * Create a new store
     * @param initialState - Initial state
     * @returns New store instance
     */
    createStore(initialState: StateObject = {}): Store {
      return new Store(initialState);
    }
  };
}

export default createDataManager;

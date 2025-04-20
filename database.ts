import * as SQLite from 'expo-sqlite';
import { MarkerType, RouteType, RoutePointType } from './types';

let db: SQLite.SQLiteDatabase;

const initializeDatabase = async () => {
  db = await SQLite.openDatabaseAsync('databaseName');
};

initializeDatabase();

export const initDB = async () => {
  if (!db) return;
  // Create markers table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );`
  );
  
  // Create routes table
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );`
  );
  
  // Create route_points table to store markers in a route
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS route_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routeId INTEGER NOT NULL,
      markerId INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      FOREIGN KEY (routeId) REFERENCES routes (id) ON DELETE CASCADE,
      FOREIGN KEY (markerId) REFERENCES markers (id) ON DELETE SET NULL
    );`
  );
};

export const insertMarker = async (latitude: number, longitude: number) => {
  if (!db) return;
  const result = await db.runAsync(
    'INSERT INTO markers (latitude, longitude) VALUES (?, ?);',
    [latitude, longitude]
  );
  return result.lastInsertRowId;
};

export const fetchMarkers = async (): Promise<MarkerType[]> => {
  if (!db) return [];
  const result = await db.getAllAsync('SELECT * FROM markers;');
  return result.map((row: any) => ({
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
};

export const deleteMarkers = async () => {
  if (!db) return;
  await db.runAsync('DELETE FROM markers;');
};

// Route functions
export const createRoute = async (name: string, points: { markerId: number, latitude: number, longitude: number }[]): Promise<number> => {
  if (!db) return -1;
  
  try {
    // Insert the route
    const result = await db.runAsync(
      'INSERT INTO routes (name, createdAt) VALUES (?, ?);',
      [name, Date.now()]
    );
    
    const routeId = result.lastInsertRowId;
    
    // Insert all route points
    for (let i = 0; i < points.length; i++) {
      const { markerId, latitude, longitude } = points[i];
      await db.runAsync(
        'INSERT INTO route_points (routeId, markerId, sequence, latitude, longitude) VALUES (?, ?, ?, ?, ?);',
        [routeId, markerId, i, latitude, longitude]
      );
    }
    
    return routeId;
  } catch (error) {
    console.error('Error creating route:', error);
    throw error;
  }
};

export const fetchRoutes = async (): Promise<RouteType[]> => {
  if (!db) return [];
  
  const result = await db.getAllAsync('SELECT * FROM routes ORDER BY createdAt DESC;');
  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
  }));
};

export const fetchRoutePoints = async (routeId: number): Promise<RoutePointType[]> => {
  if (!db) return [];
  
  const result = await db.getAllAsync(
    'SELECT * FROM route_points WHERE routeId = ? ORDER BY sequence;',
    [routeId]
  );
  
  return result.map((row: any) => ({
    id: row.id,
    routeId: row.routeId,
    markerId: row.markerId,
    sequence: row.sequence,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
};

export const deleteRoute = async (routeId: number) => {
  if (!db) return;
  await db.runAsync('DELETE FROM routes WHERE id = ?;', [routeId]);
};
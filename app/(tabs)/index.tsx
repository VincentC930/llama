// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, Button, Text, TextInput, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { Marker, MapPressEvent, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { initDB, insertMarker, fetchMarkers, deleteMarkers, createRoute, fetchRoutes, fetchRoutePoints, deleteRoute } from '@/database';
import { MarkerType, RouteType, RoutePointType } from '@/types';

export default function MapScreen() {
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  
  // Route creation state
  const [routeName, setRouteName] = useState('');
  const [showSaveRouteModal, setShowSaveRouteModal] = useState(false);
  
  // Routes display state
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePointType[]>([]);
  const [showRoutesModal, setShowRoutesModal] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initDB(); // Ensure DB is initialized before proceeding

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      const savedMarkers = await fetchMarkers();
      setMarkers(savedMarkers); // Load markers from the database
      
      // Load saved routes
      loadRoutes();
    };

    setup();
  }, []);
  
  const loadRoutes = async () => {
    console.log('Attempting to load saved routes');
    try {
      const savedRoutes = await fetchRoutes();
      console.log(`Successfully loaded ${savedRoutes.length} routes`);
      savedRoutes.forEach(route => {
        console.log(`Route: ${route.id} - ${route.name} (created: ${new Date(route.createdAt).toLocaleString()})`);
      });
      setRoutes(savedRoutes);
    } catch (error) {
      console.error('Failed to load routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    }
  };

  const handleMapPress = async (event: MapPressEvent) => {
    console.log('Map pressed - creating new marker');

    if (selectedRoute) {
      console.warn('Cannot add markers while viewing a route');
      Alert.alert('Error', 'You cannot add markers while viewing a route.');
      return;
    }
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Insert into the database in the background
    try {
      const newMarkerId = await insertMarker(latitude, longitude);
      
      // Update the state and log the updated markers
      const newMarker = { id: Number(newMarkerId), latitude, longitude };
      setMarkers(prev => {
        const updatedMarkers = [...prev, newMarker];
        console.log('Marker added successfully:', newMarker);
        console.log(`Total markers: ${updatedMarkers.length}`);
        return updatedMarkers;
      });
      
    } catch (error) {
      console.error('Failed to insert marker:', error);
      Alert.alert('Error', 'Failed to add marker');
    }
  };

  const handleDeleteMarkers = async () => {
    try {
      await deleteMarkers(); // Clear markers from the database
      setMarkers([]); // Clear markers from the state
      console.log('All markers deleted successfully');
      // Clear route selection if any
      setSelectedRoute(null);
      setRoutePoints([]);
    } catch (error) {
      console.error('Failed to delete markers:', error);
      Alert.alert('Error', 'Failed to delete markers. Please try again.');
    }
  };
  
  const startRouteCreation = () => {
    console.log('Starting route creation');
    
    if (markers.length < 2) {
      console.warn('Cannot create route: Not enough markers on the map');
      Alert.alert('Error', 'Add at least two markers on the map before creating a route.');
      return;
    }
    
    // Open save route modal directly
    setShowSaveRouteModal(true);
    console.log(`Using ${markers.length} markers for the route`);
  };
  
  const cancelRouteCreation = () => {
    setShowSaveRouteModal(false);
    setRouteName('');
  };
  
  const saveRoute = async () => {
    console.log(`Attempting to save route with ${markers.length} markers`);
    
    if (markers.length < 2) {
      console.warn('Route creation failed: Not enough markers selected');
      Alert.alert('Error', 'You need at least two markers to create a route.');
      return;
    }

    if (!routeName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    try {
      console.log('Route markers:', markers.map(m => m.id).join(', '));
      
      // Create an array of marker objects with all required properties
      // Only include markers with valid IDs to prevent database constraint errors
      const markerPoints = markers
        .filter(marker => marker.id !== undefined && marker.id !== null)
        .map(marker => ({
          markerId: marker.id,
          latitude: marker.latitude,
          longitude: marker.longitude
        }));
      
      if (markerPoints.length < 2) {
        console.error('Not enough valid markers with IDs');
        Alert.alert('Error', 'There was a problem with the markers. Please try creating new markers.');
        return;
      }
      
      const routeId = await createRoute(routeName, markerPoints);
      console.log('Route created successfully with ID:', routeId);
      
      // Clear markers from database and state after route is created
      await deleteMarkers(); 
      setMarkers([]);
      
      setShowSaveRouteModal(false);
      setRouteName('');
      
      Alert.alert('Success', 'Route saved successfully!');
      
      // Refresh the list of routes
      console.log('Refreshing routes list after save');
      loadRoutes();
    } catch (error) {
      console.error('Failed to save route:', error);
      Alert.alert('Error', 'Failed to save route. Please try again.');
    }
  };

  const handleRoutePress = async (route: RouteType) => {
    console.log(`Attempting to view route: ${route.id} - ${route.name}`);
    try {
      // First, clear any existing markers from the creation flow
      setMarkers([]);
      
      const points = await fetchRoutePoints(route.id);
      console.log(`Loaded ${points.length} points for route ${route.id}`);
      points.forEach((point, index) => {
        console.log(`Point ${index}: Marker ${point.markerId} at position (${point.latitude}, ${point.longitude})`);
      });
      
      setSelectedRoute(route);
      setRoutePoints(points);
      setShowRoutesModal(false);
      
      // If there are route points, center the map on the first point
      if (points.length > 0) {
        const firstPoint = points[0];
        setRegion({
          latitude: firstPoint.latitude,
          longitude: firstPoint.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Failed to load route points:', error);
      Alert.alert('Error', 'Failed to load route details');
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    try {
      await deleteRoute(routeId);
      setSelectedRoute(null);
      setRoutePoints([]);
      loadRoutes(); // Refresh the list of routes
    } catch (error) {
      console.error('Failed to delete route:', error);
      Alert.alert('Error', 'Failed to delete route. Please try again.');
    }
  };

  if (!region) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        key={markers.length} // Force re-render when markers change
      >
        {/* Show markers only when not viewing a saved route */}
        {!selectedRoute && markers.map(marker => (
          <Marker 
            key={marker.id} 
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          />
        ))}
        
        {/* Preview current markers as a route with a polyline */}
        {markers.length >= 2 && !selectedRoute && (
          <Polyline
            coordinates={markers.map(marker => ({
              latitude: marker.latitude,
              longitude: marker.longitude,
            }))}
            strokeColor="#0066FF"
            strokeWidth={3}
          />
        )}
        
        {/* Display selected route */}
        {selectedRoute && (
          <>
            <Polyline
              coordinates={routePoints.map(point => ({
                latitude: point.latitude,
                longitude: point.longitude,
              }))}
              strokeColor="#000"
              strokeWidth={3}
            />
            {/* Display markers for the selected route */}
            {routePoints.map((point, index) => (
              <Marker 
                key={`route-point-${point.id}`}
                coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                title={index === 0 ? "Start" : index === routePoints.length - 1 ? "End" : `Point ${index + 1}`}
              />
            ))}
          </>
        )}
      </MapView>
      
      {/* Add active route indicator */}
      {selectedRoute && (
        <View style={styles.routeIndicator}>
          <Text style={styles.routeIndicatorText}>
            Viewing: {selectedRoute.name}
          </Text>
          <TouchableOpacity 
            style={styles.clearRouteButton}
            onPress={() => {
              setSelectedRoute(null);
              setRoutePoints([]);
            }}
          >
            <Text style={styles.clearRouteButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Only show the button controls when not viewing a route */}
      {!selectedRoute && (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: '#FF5252' }, // Make the button red
              markers.length === 0 && styles.buttonDisabled
            ]}
            onPress={handleDeleteMarkers}
            disabled={markers.length === 0}
            >
            <Text style={styles.buttonText}>Delete All</Text>
            </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, markers.length < 2 && styles.buttonDisabled]} 
            onPress={startRouteCreation}
            disabled={markers.length < 2}
          >
            <Text style={styles.buttonText}>
              Create Route
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setShowRoutesModal(true)}
          >
            <Text style={styles.buttonText}>View Routes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Save Route Modal */}
      <Modal visible={showSaveRouteModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save Route</Text>
            <TextInput
              style={styles.input}
              placeholder="Route Name"
              value={routeName}
              onChangeText={setRouteName}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={cancelRouteCreation}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton]} 
                onPress={saveRoute}
              >
                <Text style={[styles.modalButtonText, styles.primaryButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Routes List Modal */}
      <Modal visible={showRoutesModal} animationType="slide">
        <SafeAreaView style={styles.routesModalContainer}>
          <View style={styles.routesModalHeader}>
            <Text style={styles.modalTitle}>Saved Routes</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowRoutesModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {routes.length === 0 ? (
            <View style={styles.emptyRouteContainer}>
              <Text style={styles.emptyRouteText}>No saved routes yet.</Text>
            </View>
          ) : (
            <FlatList
              data={routes}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.routeItemContainer}>
                  <TouchableOpacity 
                    style={styles.routeItem} 
                    onPress={() => handleRoutePress(item)}
                  >
                    <Text style={styles.routeItemText}>{item.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRoute(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.routesList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: 'absolute',
    bottom: 100, // Moved up from 100 to ensure it's visible on smaller screens
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#007BFF',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // New route indicator styles
  routeIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  routeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearRouteButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  clearRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Existing modal styles with improved contrast
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  primaryButton: {
    backgroundColor: '#007BFF',
  },
  modalButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#fff',
  },
  routesModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  routesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 22,
    color: '#333',
  },
  emptyRouteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRouteText: {
    fontSize: 18,
    color: '#666',
  },
  routeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeItem: {
    flex: 1,
    padding: 15,
  },
  routeItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  routesList: {
    padding: 15,
  },
});

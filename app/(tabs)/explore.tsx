import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, Platform, ScrollView, ActivityIndicator, TouchableOpacity, View as RNView, View, ToastAndroid, Alert } from 'react-native';
import * as Location from 'expo-location';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { fetchRoutes, fetchRoutePoints } from '@/database';
import { RouteType, RoutePointType } from '@/types';
// import { LinearGradient } from 'expo-linear-gradient';

// Mock route and weather data for demonstration
const MOCK_ROUTE = {
  id: 999,
  name: 'Demo Route',
  createdAt: Date.now()
};

const MOCK_ROUTE_POINTS = [
  { id: 1, routeId: 999, markerId: 1, sequence: 0, latitude: 37.7749, longitude: -122.4194 },
  { id: 2, routeId: 999, markerId: 2, sequence: 1, latitude: 37.7850, longitude: -122.4300 },
  { id: 3, routeId: 999, markerId: 3, sequence: 2, latitude: 37.7900, longitude: -122.4150 },
];

const WEATHER_DATA = {
  temperature: 72,
  condition: 'Sunny',
  humidity: 45,
  windSpeed: 8,
};

export default function ExploreScreen() {
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteType | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePointType[]>([]);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          return;
        }

        // Get user's current location
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);

        // Fetch available routes
        const routes = await fetchRoutes();
        
        // If we have routes from the database, use the most recent one
        if (routes.length > 0) {
          console.log('Found existing route:', routes[0].name);
          const mostRecentRoute = routes[0]; // Assuming routes are ordered by createdAt DESC
          setActiveRoute(mostRecentRoute);
          
          // Fetch route points for the selected route
          const points = await fetchRoutePoints(mostRecentRoute.id);
          setRoutePoints(points);
          
          // Generate briefing data with real route information
          const briefing = generateBriefingData(location, mostRecentRoute, points);
          setBriefingData(briefing);
          
          // Fetch chat response from API
          const response = await fetchChatResponse(briefing);
          setChatResponse(response);
        } else {
          console.log('No routes found, using mock data');
          // No routes found, keep using mock data for demonstration
          setUseMockData(true);
          setActiveRoute(MOCK_ROUTE);
          setRoutePoints(MOCK_ROUTE_POINTS);
          
          // Generate briefing with mock data
          const briefing = generateBriefingData(location, MOCK_ROUTE, MOCK_ROUTE_POINTS);
          setBriefingData(briefing);
          
          // Fetch chat response from API using mock data
          const response = await fetchChatResponse(briefing);
          setChatResponse(response);
        }
      } catch (error) {
        console.error('Error initializing explore screen:', error);
        // Fall back to mock data in case of error
        if (currentLocation) {
          setUseMockData(true);
          setActiveRoute(MOCK_ROUTE);
          setRoutePoints(MOCK_ROUTE_POINTS);
          const briefing = generateBriefingData(currentLocation, MOCK_ROUTE, MOCK_ROUTE_POINTS);
          setBriefingData(briefing);
          const response = generateChatResponse(briefing);
          setChatResponse(response);
        }
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Calculate distance between two coordinates in kilometers using the Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const degToRad = (degrees: number): number => degrees * (Math.PI / 180);

    // Convert latitude and longitude from degrees to radians
    const lat1Rad = degToRad(lat1);
    const lon1Rad = degToRad(lon1);
    const lat2Rad = degToRad(lat2);
    const lon2Rad = degToRad(lon2);

    // Difference in coordinates
    const deltaLat = lat2Rad - lat1Rad;
    const deltaLon = lon2Rad - lon1Rad;

    // Haversine formula calculation
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  };

  // Generate JSON briefing data based on user location and route information
  const generateBriefingData = (
    location: Location.LocationObject, 
    route: RouteType, 
    points: RoutePointType[]
  ) => {
    if (!location || !route || points.length < 2) {
      console.log('Insufficient data to generate briefing, using mock data');
      // Provide default values if we're missing data
      return {
        routeName: route?.name || 'Demo Route',
        routeId: route?.id || 999,
        currentLocation: {
          latitude: location?.coords.latitude || 37.7749,
          longitude: location?.coords.longitude || -122.4194,
        },
        nearestPointIndex: 1,
        totalPoints: points.length || 3,
        totalDistance: '5.20',
        completedDistance: '2.10',
        remainingDistance: '3.10',
        progressPercentage: 40,
        estimatedTimeRemaining: {
          hours: 0,
          minutes: 37,
        },
        weather: WEATHER_DATA,
        timestamp: new Date().toISOString(),
      };
    }

    // Find the nearest point on the route to current location
    let nearestPointIndex = 0;
    let minDistance = Number.MAX_VALUE;
    
    points.forEach((point, index) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        point.latitude,
        point.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPointIndex = index;
      }
    });
    
    // Calculate total route distance using Haversine formula
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += calculateDistance(
        points[i].latitude,
        points[i].longitude,
        points[i+1].latitude,
        points[i+1].longitude
      );
    }
    
    // Calculate completed distance
    let completedDistance = 0;
    for (let i = 0; i < nearestPointIndex; i++) {
      completedDistance += calculateDistance(
        points[i].latitude,
        points[i].longitude,
        points[i+1].latitude,
        points[i+1].longitude
      );
    }
    
    // Add distance from current location to nearest point for more accuracy
    // if nearest point is not the first point
    if (nearestPointIndex > 0) {
      // Calculate remaining distance to the nearest point
      const distanceToNearestPoint = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        points[nearestPointIndex].latitude,
        points[nearestPointIndex].longitude
      );
      
      // Adjust completed distance based on user's position between points
      const segmentLength = calculateDistance(
        points[nearestPointIndex-1].latitude,
        points[nearestPointIndex-1].longitude,
        points[nearestPointIndex].latitude,
        points[nearestPointIndex].longitude
      );
      
      // If user is past the nearest point, count that segment as complete
      // Otherwise adjust based on proximity
      if (distanceToNearestPoint <= 0.05) { // Within 50 meters
        completedDistance = calculateDistance(
          points[0].latitude,
          points[0].longitude,
          points[nearestPointIndex].latitude,
          points[nearestPointIndex].longitude
        );
      }
    }
    
    // Calculate remaining distance
    const remainingDistance = totalDistance - completedDistance;
    
    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.round((completedDistance / totalDistance) * 100));
    
    // Calculate estimated time to completion (assuming average walking speed of 5 km/h)
    const estimatedHours = remainingDistance / 5;
    const hours = Math.floor(estimatedHours);
    const minutes = Math.round((estimatedHours - hours) * 60);
    
    // Attempt to fetch real weather data (would need a weather API)
    // For now, using the mock weather data
    
    return {
      routeName: route.name,
      routeId: route.id,
      currentLocation: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      nearestPointIndex,
      totalPoints: points.length,
      totalDistance: totalDistance.toFixed(2),
      completedDistance: completedDistance.toFixed(2),
      remainingDistance: remainingDistance.toFixed(2),
      progressPercentage,
      estimatedTimeRemaining: {
        hours,
        minutes,
      },
      weather: WEATHER_DATA, // Replace with actual weather API call if available
      timestamp: new Date().toISOString(),
    };
  };

  // Generate mock chat response based on briefing data
  const generateChatResponse = (briefingData: any) => {
    if (!briefingData) {
      return {
        greeting: "Good day! Welcome to your journey assistant.",
        progressSummary: "Ready to start your adventure?",
        timeEstimate: "Your journey awaits!",
        weatherUpdate: `Current conditions: ${WEATHER_DATA.temperature}°F, ${WEATHER_DATA.condition}, with ${WEATHER_DATA.humidity}% humidity.`,
        tips: ["Remember to stay hydrated during your trip!", "Check the map tab to create your first route."],
        encouragement: "Every journey begins with a single step.",
      };
    }
    
    const { 
      routeName, 
      progressPercentage, 
      completedDistance, 
      totalDistance,
      estimatedTimeRemaining,
      weather 
    } = briefingData;
    
    // Generate personalized tips based on progress and weather
    let tips = [];
    
    if (progressPercentage < 25) {
      tips.push("Pace yourself! You're just getting started on this journey.");
    } else if (progressPercentage < 50) {
      tips.push("You've made good progress, but remember to stay hydrated!");
    } else if (progressPercentage < 75) {
      tips.push("You're over halfway there - keep up the good work!");
    } else {
      tips.push("You're in the final stretch! Push through to complete your route.");
    }
    
    // Weather-based tips
    if (weather.temperature > 80) {
      tips.push("It's quite warm today. Remember to drink plenty of water and use sun protection.");
    } else if (weather.temperature < 60) {
      tips.push("It's a bit cool today. Consider wearing an extra layer to stay comfortable.");
    }
    
    if (weather.condition === 'Rainy') {
      tips.push("Watch out for slippery surfaces due to rain.");
    }
    
    return {
      greeting: `Good ${getTimeOfDay()}! Your journey on "${routeName}" continues.`,
      progressSummary: `You've completed ${progressPercentage}% of your route (${completedDistance} km out of ${totalDistance} km).`,
      timeEstimate: `At your current pace, you have approximately ${estimatedTimeRemaining.hours} hours and ${estimatedTimeRemaining.minutes} minutes remaining.`,
      weatherUpdate: `Current conditions: ${weather.temperature}°F, ${weather.condition}, with ${weather.humidity}% humidity.`,
      tips: tips,
      encouragement: getRandomEncouragement(),
    };
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const getRandomEncouragement = () => {
    const encouragements = [
      "You're doing great! Keep moving forward.",
      "Every step brings you closer to your goal.",
      "Enjoying the journey is just as important as reaching the destination.",
      "Your determination is inspiring!",
      "Remember to take in the scenery along the way."
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  // Add fetch function for chat responses
  const fetchChatResponse = async (briefingData: any) => {
    try {
      // Configure your actual API endpoint here
      const apiUrl = 'https://your-api-endpoint.com/path';
      
      // Prepare the data to send including the required parameters
      const dataToSend = {
        ...briefingData,
        distanceTravelled: briefingData.completedDistance,
        distanceLeft: briefingData.totalDistance - briefingData.completedDistance,
        daysTravelled: 0, // Hard coded to 0 as requested
        long: briefingData.currentLocation?.coords?.longitude || 0,
        lat: briefingData.currentLocation?.coords?.latitude || 0
      };
      
      console.log('Sending briefing data to API:', JSON.stringify(dataToSend).substring(0, 100) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend),
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, content type:', contentType);
        // Try to get the response text for debugging
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200) + '...');
        throw new Error('Response is not valid JSON');
      }
      
      // Parse the JSON response
      const data = await response.json();
      console.log('Successfully received chat response from API');
      
      // Ensure the response has the expected format (summary and tips)
      if (!data.summary || !data.tips) {
        console.warn('API response missing expected format, transforming data');
        return {
          summary: data.summary || 'Journey in progress',
          tips: data.tips || ['Stay hydrated!']
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching chat response:', error);
      
      // Fall back to generated response if API fails
      console.log('Falling back to locally generated response');
      
      // Convert the response format to match the expected structure
      const generatedResponse = generateChatResponse(briefingData);
      return {
        summary: `${generatedResponse.greeting} ${generatedResponse.progressSummary} ${generatedResponse.timeEstimate}`,
        tips: generatedResponse.tips
      };
    }
  };

  // Add refresh function
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Show feedback that we're refreshing
      if (Platform.OS === 'android') {
        ToastAndroid.show('Refreshing data...', ToastAndroid.SHORT);
      } else {
        // For iOS, you could use Alert or a custom toast component
        // For now, we'll just log to console
        console.log('Refreshing data...');
      }
      
      // Get updated location
      const updatedLocation = await Location.getCurrentPositionAsync({});
      setCurrentLocation(updatedLocation);
      
      if (activeRoute) {
        // Generate updated briefing data
        const updatedBriefing = generateBriefingData(updatedLocation, activeRoute, routePoints);
        setBriefingData(updatedBriefing);
        
        try {
          // Fetch updated chat response
          const updatedResponse = await fetchChatResponse(updatedBriefing);
          setChatResponse(updatedResponse);
        } catch (chatError) {
          console.error('Chat response error during refresh:', chatError);
          // Use generated response as fallback
          const fallbackResponse = generateChatResponse(updatedBriefing);
          setChatResponse(fallbackResponse);
        }
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show('Data refreshed successfully!', ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      
      // Show error message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to refresh data', ToastAndroid.SHORT);
      } else {
        Alert.alert('Refresh Failed', 'Unable to update your information at this time.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function to toggle between mock and real data for testing
  const toggleMockData = () => {
    setUseMockData(!useMockData);
    
    // If toggling to mock data, update with mock data
    if (!useMockData) {
      setActiveRoute(MOCK_ROUTE);
      setRoutePoints(MOCK_ROUTE_POINTS);
      if (currentLocation) {
        const mockBriefing = generateBriefingData(currentLocation, MOCK_ROUTE, MOCK_ROUTE_POINTS);
        setBriefingData(mockBriefing);
        const mockResponse = generateChatResponse(mockBriefing);
        setChatResponse(mockResponse);
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Switched to demo mode', ToastAndroid.SHORT);
      }
    } else {
      // Refresh to get real data
      refreshData();
      if (Platform.OS === 'android') {
        ToastAndroid.show('Switched to real data mode', ToastAndroid.SHORT);
      }
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <ThemedText style={styles.loadingText}>Loading your daily briefing...</ThemedText>
      </ThemedView>
    );
  }

  if (!activeRoute || !briefingData) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Ionicons name="map" size={48} color="#666" />
        <ThemedText style={styles.emptyTitle}>No Active Routes</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          Create a route in the Map tab to see your daily briefing.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView>
      <View style={styles.header}>
        {/* <LinearGradient
          colors={['#007BFF', '#0056b3']}
          style={styles.headerGradient}
        >
          <ThemedText style={styles.headerTitle}>Daily Briefing</ThemedText>
        </LinearGradient> */}
      </View>
      <ThemedView style={styles.container}>
        {/* Replace the existing mock data banner with this toggleable version */}
        {useMockData && (
          <ThemedView style={styles.mockDataBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="information-circle" size={18} color="#fff" />
              <ThemedText style={styles.mockDataText}>
                Demo mode - using sample route data
              </ThemedText>
            </View>
            <TouchableOpacity onPress={toggleMockData} style={styles.mockDataToggle}>
              <ThemedText style={styles.mockDataToggleText}>Switch to Real Data</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Also add a toggle button in debug mode when using real data */}
        {!useMockData && __DEV__ && (
          <TouchableOpacity onPress={toggleMockData} style={styles.debugButton}>
            <ThemedText style={styles.debugButtonText}>Switch to Demo Mode</ThemedText>
          </TouchableOpacity>
        )}

        {/* Progress Overview Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Trip Progress</ThemedText>
          <ThemedView style={styles.progressBarContainer}>
            <ThemedView 
              style={[
                styles.progressBar, 
                { width: `${briefingData.progressPercentage}%` }
              ]} 
            />
          </ThemedView>
          <ThemedText style={styles.progressText}>
            {briefingData.progressPercentage}% Complete
          </ThemedText>
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{briefingData.completedDistance} km</ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{briefingData.remainingDistance} km</ThemedText>
              <ThemedText style={styles.statLabel}>Remaining</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statValue}>{briefingData.totalDistance} km</ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Time Estimation Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Time Estimation</ThemedText>
          <ThemedView style={styles.timeContainer}>
            <Ionicons name="timer" size={24} color="#007BFF" />
            <ThemedText style={styles.timeText}>
              {briefingData.estimatedTimeRemaining.hours} h {briefingData.estimatedTimeRemaining.minutes} min remaining
            </ThemedText>
          </ThemedView>
          <ThemedText style={styles.timeSubtext}>
            Based on average walking speed of 5 km/h
          </ThemedText>
        </ThemedView>

        {/* Weather Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Today's Weather</ThemedText>
          <ThemedView style={styles.weatherContainer}>
            <ThemedView style={styles.weatherMain}>
              <Ionicons 
                name={briefingData.weather.condition === 'Sunny' ? 'sunny' : 'cloudy'} 
                size={40} // Slightly smaller icon
                color="#FF9500"
              />
              <ThemedText style={styles.temperatureText}>
                {briefingData.weather.temperature}°F
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.weatherDetails}>
              <ThemedText style={styles.weatherCondition}>
                {briefingData.weather.condition}
              </ThemedText>
              <ThemedText style={styles.weatherSubDetail}>
                Humidity: {briefingData.weather.humidity}%
              </ThemedText>
              <ThemedText style={styles.weatherSubDetail}>
                Wind: {briefingData.weather.windSpeed} mph
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Chatbot Insight Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Trip Insights</ThemedText>
          <ThemedView style={styles.chatContainer}>
            <ThemedView style={styles.chatBubble}>
              <ThemedText style={styles.chatGreeting}>{chatResponse.greeting}</ThemedText>
              <ThemedText style={styles.chatParagraph}>{chatResponse.progressSummary}</ThemedText>
              <ThemedText style={styles.chatParagraph}>{chatResponse.timeEstimate}</ThemedText>
              <ThemedText style={styles.chatParagraph}>{chatResponse.weatherUpdate}</ThemedText>
            </ThemedView>
            
            <ThemedView style={{ borderRadius: 12, padding: 16, backgroundColor: '#151718', marginBottom: 16 }}>
                {chatResponse.tips.map((tip: string, index: number) => (
                  <ThemedView key={index} style={styles.tipItem}>
                    <Entypo name="light-bulb" size={16} color="#007BFF" />
                    <ThemedText style={styles.tipText}>{tip}</ThemedText>
                  </ThemedView>
                ))}
            </ThemedView>
            
            <ThemedView style={styles.encouragementContainer}>
              <ThemedText style={styles.encouragementText}>
                {chatResponse.encouragement}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Last updated: {new Date().toLocaleTimeString()}
          </ThemedText>
          <TouchableOpacity onPress={refreshData}>
            <ThemedText style={styles.refreshText}>Refresh</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  createRouteButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007BFF',
    borderRadius: 8,
  },
  createRouteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 12, // Reduced padding to use more space
    width: '100%', // Ensure full width
  },
  mockDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#FF9500',
    borderRadius: 8,
  },
  mockDataText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16, // Reduced vertical margin
    padding: 16,
    borderRadius: 12,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.9)' : '#ffffff', // Increased opacity for better contrast
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%', // Ensure sections use full width
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000', // Ensure dark text
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#000000', // Ensure dark text
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%', // Ensure full width
    paddingHorizontal: 8, // Add some padding
    borderRadius: 8,
  },
  statItem: {
    flex: 1, // Let each stat take equal width
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5', // Changed from #F5F5F5 to dark
  },
  statLabel: {
    fontSize: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#F5F5F5', // Changed from #F5F5F5 to dark
  },
  timeSubtext: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12, // Increased padding
    borderRadius: 12,
    marginTop: 8, // Add some spacing from the section title
  },
  weatherMain: {
    width: '40%',
    flexDirection: 'column', // Changed to column layout
    alignItems: 'center',    // Center items
    justifyContent: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  temperatureText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8, // Add margin at the top
    color: '#F5F5F5', // Ensure dark text for contrast
  },
  weatherDetails: {
    width: '60%',
    paddingLeft: 16,
    alignItems: 'flex-start',
  },
  weatherCondition: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#F5F5F5',
  },
  weatherSubDetail: {
    fontSize: 14,
    color: '#F1F1F1',
    marginBottom: 4,
    textAlign: 'left',
  },
  chatContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  chatBubble: {
    backgroundColor: '#FFECB3', // Slightly darker blue background for better contrast
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%', // Use full width
  },
  chatGreeting: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000', // Ensure dark text
  },
  chatParagraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#000000', // Ensure dark text
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  encouragementContainer: {
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  encouragementText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
  },
  debugContainer: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  refreshText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  header: {
    width: '100%',
    height: 150,
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  mockDataToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mockDataToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#666',
  },
});
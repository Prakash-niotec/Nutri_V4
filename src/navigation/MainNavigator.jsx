import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import ScanScreen from '../screens/scanning/ScanScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { typography } from '../utils/typography';

const Tab = createBottomTabNavigator();

const CustomScanButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.customScanButtonWrapper}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.customScanButtonCircle}>
      <Feather name="camera" size={28} color="#FFFFFF" />
    </View>
    <Text style={styles.customScanButtonLabel}>Scan</Text>
  </TouchableOpacity>
);

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#009933',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontFamily: typography.fonts.semiBold,
          fontSize: 12,
          paddingBottom: Platform.OS === 'android' ? 8 : 4,
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ScanTab"
        component={ScanScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <CustomScanButton {...props} />,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 85 : 70,
    borderTopWidth: 0,
    elevation: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  customScanButtonWrapper: {
    top: -22,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  customScanButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#009933',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#009933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#EEF5EE',
  },
  customScanButtonLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 12,
    color: '#009933',
    marginTop: 2,
  },
});
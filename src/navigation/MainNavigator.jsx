import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import ScanScreen from '../screens/scanning/ScanScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { typography } from '../utils/typography';
import { wp, hp, fs } from '../utils/responsive';

const Tab = createBottomTabNavigator();

const CustomScanButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.customScanButtonWrapper}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.customScanButtonCircle}>
      <Feather name="camera" size={fs(26)} color="#FFFFFF" />
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
          fontSize: fs(11),
          paddingBottom: Platform.OS === 'android' ? hp(1) : hp(0.5),
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={fs(22)} color={color} />
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
        component={ProfileStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
          const hiddenRoutes = ['MedicalConditions', 'FamilyMembers', 'AddMember'];
          const isHidden = hiddenRoutes.includes(routeName);

          return {
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <Feather name="user" size={fs(22)} color={color} />
            ),
            tabBarStyle: isHidden ? { display: 'none' } : styles.tabBar,
          };
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? hp(10.5) : hp(8.5),
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
    top: -hp(2.5),
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  customScanButtonCircle: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
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
    fontSize: fs(11),
    color: '#009933',
    marginTop: hp(0.3),
  },
});
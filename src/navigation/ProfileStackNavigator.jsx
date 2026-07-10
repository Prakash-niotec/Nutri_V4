import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import FamilyMembersScreen from '../screens/profile/FamilyMembersScreen';
import AddMemberScreen from '../screens/profile/AddMemberScreen';
import MedicalConditionsScreen from '../screens/profile/MedicalConditionsScreen';

const Stack = createStackNavigator();

export default function ProfileStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
            <Stack.Screen name="AddMember" component={AddMemberScreen} />
            <Stack.Screen name="MedicalConditions" component={MedicalConditionsScreen} />
        </Stack.Navigator>
    );
}
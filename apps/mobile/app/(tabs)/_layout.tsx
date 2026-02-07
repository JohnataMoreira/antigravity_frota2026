import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons'; // Need to install or use text

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB' }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Vehicles',
                    // tabBarIcon: ({ color }) => <Ionicons name="car" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="journey"
                options={{
                    title: 'Active Journey',
                    // tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}

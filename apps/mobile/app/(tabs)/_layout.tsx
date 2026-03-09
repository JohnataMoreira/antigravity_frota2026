import { Tabs } from 'expo-router';
import { Truck, Route, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#2463eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    elevation: 0,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Lexend_700Bold',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Veículos',
                    tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="journey"
                options={{
                    title: 'Jornada',
                    tabBarIcon: ({ color }) => <Route size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                    href: null, // Perfil desativado temporariamente como no layout do Stitch
                }}
            />
        </Tabs>
    );
}

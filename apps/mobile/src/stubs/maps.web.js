import React from 'react';
import { View, Text } from 'react-native';

const MockView = ({ children, style }) => (
  <View style={[{ backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }, style]}>
    {children}
  </View>
);

export const Marker = ({ children }) => <View>{children}</View>;
export const Polyline = () => null;
export const Polygon = () => null;
export const Circle = () => null;
export const Callout = ({ children }) => <View>{children}</View>;

const MapView = ({ children, style }) => (
  <MockView style={style}>
    <Text style={{ color: '#64748b', fontWeight: 'bold' }}>Map Mock (Web)</Text>
    {children}
  </MockView>
);

MapView.Marker = Marker;
MapView.Polyline = Polyline;
MapView.Polygon = Polygon;
MapView.Circle = Circle;
MapView.Callout = Callout;

export default MapView;

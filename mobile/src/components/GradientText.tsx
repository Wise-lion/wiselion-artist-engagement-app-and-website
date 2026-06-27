// GradientText — gold gradient fill on text, matching the design's
// `-webkit-background-clip: text` gold treatment. Uses MaskedView (the text is
// the mask) over a LinearGradient.
import React from 'react';
import { Text, TextStyle, StyleProp, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// The design's GOLD_GRAD: linear-gradient(180deg, #f8e39c, #e7c463 38%, #c9a227 64%, #f3d985)
const GOLD_STOPS = ['#f8e39c', '#e7c463', '#c9a227', '#f3d985'] as const;
const GOLD_LOCS = [0, 0.38, 0.64, 1] as const;

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: readonly string[];
  locations?: readonly number[];
}

export const GradientText: React.FC<Props> = ({ children, style, colors = GOLD_STOPS, locations = GOLD_LOCS }) => {
  return (
    <MaskedView
      maskElement={
        <View style={{ backgroundColor: 'transparent' }}>
          <Text style={[style, { color: '#000' }]}>{children}</Text>
        </View>
      }
    >
      <LinearGradient colors={colors as string[]} locations={locations as number[]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        {/* Transparent text reserves the exact glyph footprint for the gradient. */}
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;

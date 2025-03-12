import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

type GovDisclaimerProps = {
  isDarkMode: boolean;
}

const GovDisclaimer = ({ isDarkMode }: GovDisclaimerProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  const openExternalLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error("Cannot open URL: " + url);
    }
  };
  
  return (
    <View style={[
      styles.section, 
      { 
        backgroundColor: isDarkMode ? 'rgba(70, 70, 70, 0.5)' : 'rgba(245, 245, 245, 0.9)',
        marginVertical: 20,
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: colors.text.secondary,
      }
    ]}>
      <Text style={[
        styles.sectionTitle,
        { 
          color: colors.text.primary, 
          fontWeight: 'bold',
          fontSize: 15
        }
      ]}>
        INDEPENDENT APPLICATION NOTICE
      </Text>
    <Text style={[
      styles.paragraph,
      { 
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 20
      }
    ]}>
      NadoBeep is NOT affiliated with, endorsed by, or an official product of any government agency. 
      This app relays public data from the National Weather Service (NWS), a federal government agency 
      under the National Oceanic and Atmospheric Administration (NOAA).
      
      All weather alerts, warnings, and emergency notifications displayed in this app are sourced 
      directly from the official NWS public API.
    </Text>
    <TouchableOpacity 
      onPress={() => openExternalLink("https://alerts.weather.gov/")}
      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
    >
      <Text style={{ color: colors.primary, marginRight: 4 }}>
        View official NWS alerts website
      </Text>
      <Feather name="external-link" size={14} color={colors.primary} />
    </TouchableOpacity>
    </View>
  );
};

export default GovDisclaimer;

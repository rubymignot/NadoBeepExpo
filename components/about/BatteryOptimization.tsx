import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Battery, AlertTriangle } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type ManufacturerInfo = {
  hasSpecialRequirements: boolean;
  manufacturer: string | null;
  instructions: string;
}

type BatteryOptimizationProps = {
  isDarkMode: boolean;
  manufacturerInfo: ManufacturerInfo | null;
  handleOpenBatterySettings: () => void;
}

const BatteryOptimization = ({ 
  isDarkMode, 
  manufacturerInfo, 
  handleOpenBatterySettings 
}: BatteryOptimizationProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  return (
    <View style={[
      styles.section, 
      {
        backgroundColor: isDarkMode ? 'rgba(255, 248, 225, 0.1)' : '#FFF8E1',
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
      }
    ]}>
      <View style={styles.sectionTitleContainer}>
        <Battery size={20} color={colors.warning} />
        <Text style={[styles.sectionTitle, {marginLeft: 8, marginBottom: 0, color: colors.text.primary}]}>
          Battery Optimization
        </Text>
      </View>
      
      <Text style={styles.paragraph}>
        For reliable background notifications on Android, this app needs to be exempt from battery optimization.
      </Text>
      
      {manufacturerInfo?.hasSpecialRequirements && (
        <View style={[
          styles.manufacturerWarning,
          { backgroundColor: isDarkMode ? 'rgba(230, 126, 34, 0.2)' : 'rgba(230, 126, 34, 0.1)' }
        ]}>
          <AlertTriangle size={18} color={colors.warning} />
          <Text style={[
            styles.manufacturerWarningText,
            { color: isDarkMode ? '#ff9f43' : '#d35400' }
          ]}>
            Your device ({manufacturerInfo.manufacturer}) requires special battery settings.
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[
          styles.batteryButton, 
          { backgroundColor: colors.warning }
        ]} 
        onPress={handleOpenBatterySettings}
      >
        <Text style={[styles.batteryButtonText, {color: isDarkMode ? '#000' : '#fff'}]}>
          Open Battery Settings
        </Text>
      </TouchableOpacity>
      
      {manufacturerInfo && (
        <Text style={[styles.batteryInstructions, {color: colors.text.secondary}]}>
          {manufacturerInfo.instructions}
        </Text>
      )}
    </View>
  );
};

export default BatteryOptimization;

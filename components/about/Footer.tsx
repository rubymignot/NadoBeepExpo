import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Github, Twitter } from 'lucide-react-native';
import { createThemedStyles } from '@/styles/about.styles';
import { LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type FooterProps = {
  isDarkMode: boolean;
}

const Footer = ({ isDarkMode }: FooterProps) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = createThemedStyles(colors);
  
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't open link", err));
  };
  
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Made in France 🇫🇷 by </Text>
      <TouchableOpacity onPress={() => openLink('https://rubymignot.com')}>
        <Text style={[styles.footerText, { color: colors.primary }]}>Ruby Mignot - rubymignot.com</Text>
      </TouchableOpacity>
      <View style={styles.socialLinks}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => openLink('https://github.com/rubynouille/NadoBeepExpo')}
        >
          <Github size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => openLink('https://x.com/RubyNouille')}
        >
          <Twitter size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Footer;

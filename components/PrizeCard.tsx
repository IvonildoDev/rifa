import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  image?: any;
  imageUri?: string | null;
};

export default function PrizeCard({ title, subtitle, image, imageUri }: Props) {
  const imageSource = imageUri ? { uri: imageUri } : image;
  
  return (
    <View style={styles.card}>
      {imageSource ? <Image source={imageSource} style={styles.image} resizeMode="cover" /> : <View style={styles.placeholder} />}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#1a1410',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a1f17',
  },
  placeholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#2a1f17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#e5e5e5',
    fontSize: 14,
    marginTop: 6,
    opacity: 0.8,
  },
});

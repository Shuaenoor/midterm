import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Dimensions, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surah } from '../types';

const SURAH_STORAGE_KEY = 'stored_surahs';
const QURAN_API_URL = 'https://api.alquran.cloud/v1/quran/en.asad';
const { height } = Dimensions.get('window'); // Get screen height

const SurahListScreen: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahDetails, setSurahDetails] = useState<any>(null);

  const fetchSurahsFromAPI = async () => {
    try {
      const response = await axios.get('https://api.alquran.cloud/v1/surah');
      
      if (response.status === 200) {
        const surahData = response.data.data;
        setSurahs(surahData);
        await AsyncStorage.setItem(SURAH_STORAGE_KEY, JSON.stringify(surahData));
      } else {
        console.error(`Server returned status ${response.status}`);
        Alert.alert("Error", "Failed to fetch surahs from server. Try again later.");
      }
    } catch (error) {
      console.error('Error fetching surahs from API:', error);
      Alert.alert("Error", "There was a problem loading the surahs. Showing offline data if available.");
      await loadStoredSurahs();
    } finally {
      setLoading(false);
    }
  };

  const loadStoredSurahs = async () => {
    try {
      const storedSurahs = await AsyncStorage.getItem(SURAH_STORAGE_KEY);
      if (storedSurahs) {
        setSurahs(JSON.parse(storedSurahs));
      }
    } catch (error) {
      console.error('Error loading surahs from AsyncStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurahDetails = async (surahNumber: number) => {
    try {
      const response = await axios.get(QURAN_API_URL);
      if (response.status === 200) {
        const data = response.data.data.surahs.find((s: any) => s.number === surahNumber);
        setSurahDetails(data);
      } else {
        Alert.alert("Error", "Failed to fetch surah details.");
      }
    } catch (error) {
      console.error("Error fetching surah details:", error);
    }
  };

  const handleSurahPress = (surahNumber: number) => {
    if (surahNumber === selectedSurah) {
      setSelectedSurah(null);
      setSurahDetails(null);
    } else {
      setSelectedSurah(surahNumber);
      fetchSurahDetails(surahNumber);
    }
  };

  useEffect(() => {
    fetchSurahsFromAPI();
  }, []);

  const renderSurahDetails = (surahNumber: number) => {
    if (selectedSurah === surahNumber && surahDetails) {
      return (
        <View style={styles.surahDetailsContainer}>
          {surahDetails.ayahs.map((ayah: any, index: number) => (
            <Text key={index} style={styles.ayahText}>
              {ayah.numberInSurah}. {ayah.text}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }: { item: Surah }) => (
    <View>
      <TouchableOpacity
        style={styles.surahContainer}
        onPress={() => handleSurahPress(item.number)}
      >
        <Text style={styles.surahName}>
          {item.number}. {item.englishName} ({item.englishNameTranslation})
        </Text>
      </TouchableOpacity>
      {renderSurahDetails(item.number)}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Light Purple Box with Last Read Section */}
      <View style={styles.purpleBox}>
        <View style={styles.leftSide}>
          <Text style={styles.lastReadText}>Last Read:</Text>
          <Text style={styles.surahText}>Surah Al-Fatiha</Text>
          <Text style={styles.ayahhText}>Ayat 1</Text>
        </View>
        <Image 
          source={require('../assets/quran.png')} // Update with the correct path to your image
          style={styles.quranImage} 
          resizeMode="contain"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={surahs}
          keyExtractor={(item) => item.number.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default SurahListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  purpleBox: {
    height: height * 0.4, // 20% of the screen height
    backgroundColor: '#e6e6fa', // Light purple color
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center vertically
    padding: 10,
    marginBottom: 10,
  },
  leftSide: {
    flex: 1,
    justifyContent: 'center',
  },
  lastReadText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  surahText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ayahText: {
    fontSize: 16,
  },
  quranImage: {
    width: 80, // Adjust width as needed
    height: '100%', // Fill height of the box
    marginLeft: 10,
  },
  surahContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  surahName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  surahDetailsContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  ayahhText: {
    fontSize: 16,
    paddingVertical: 2,
  },
});

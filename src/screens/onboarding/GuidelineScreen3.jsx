import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { typography } from '../../utils/typography';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fs, SCREEN_WIDTH } from '../../utils/responsive';

const GuidelineScreen3 = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image
          source={require('../../assets/images/guideline3.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.titleText}>
          Get clear, colour-coded safety scores and instant warnings for potential allergens or dietary triggers.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TermsAndConditionsScreen')}
          >
            <Ionicons name="checkmark" size={fs(22)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF4EC',
  },
  imageWrapper: {
    height: hp(58),
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: wp(12),
    borderBottomRightRadius: wp(12),
    backgroundColor: '#fff',
    borderBottomWidth: 6,
    borderBottomColor: '#2ecc71',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  image: {
    width: SCREEN_WIDTH * 0.8,
    height: hp(52),
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(3.5),
    justifyContent: 'space-between',
    paddingBottom: hp(4.5),
  },
  titleText: {
    fontFamily: typography.fonts.extraBold,
    fontSize: fs(20),
    color: '#000000',
    lineHeight: fs(20) * 1.5,
    textAlign: 'center',
    paddingHorizontal: wp(2),
  },
  buttonContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  nextButton: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default GuidelineScreen3;
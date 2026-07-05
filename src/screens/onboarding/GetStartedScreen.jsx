import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import Button from '../../components/common/Button';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { wp, hp, fs, SCREEN_WIDTH } from '../../utils/responsive';

const GetStartedScreen = ({ navigation }) => {
  return (
    <SafeAreaWrapper backgroundColor="#E8F5E9">
      <View style={styles.container}>

        {/* Top Section - Illustration */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/onboarding-illustration.png')}
            style={styles.illustration}
            resizeMode="cover"
          />
        </View>

        {/* Middle Section - Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.description}>
            Welcome to NutriLens! Take control of your well-being with the power of AI-driven food analysis. Simply scan any meal, ingredient, or "barcode" to instantly uncover its nutritional breakdown and verify if it's safe for your personal dietary needs, allergies, and health goals. We're here to make smart, personalized nutrition effortless so you can eat with confidence.
          </Text>
        </View>

        {/* Bottom Section - Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Guideline1')}
            variant="primary"
          />
          <Button
            title="Log In"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
          />
        </View>

      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 0.55,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  illustration: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  textContainer: {
    flex: 0.3,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
  },
  description: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(15),
    color: colors.textPrimary,
    lineHeight: fs(15) * 1.5,
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 0.2,
    paddingHorizontal: wp(6),
    paddingBottom: hp(2.5),
    justifyContent: 'flex-end',
    gap: hp(1.5),
  },
});

export default GetStartedScreen;
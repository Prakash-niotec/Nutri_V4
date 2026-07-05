import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { loginUser, resetPassword } from '../../services/firebase/authService';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const InputField = ({ icon, placeholder, secureTextEntry, value, onChangeText, error, keyboardType, autoCapitalize }) => {
  return (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <Feather name={icon} size={fs(18)} color={error ? colors.primaryRed : "#212121"} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#555"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    setGeneralError('');

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await loginUser(email.trim(), password);
        Alert.alert(
          "Welcome Back!",
          "You have logged in successfully.",
          [{ text: "OK", onPress: () => { } }]
        );
      } catch (error) {
        console.error("Login error:", error);
        let msg = "Failed to login. Please check your credentials.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          msg = "Invalid email or password. Please try again.";
        } else if (error.code === 'auth/too-many-requests') {
          msg = "Too many failed login attempts. Please try again later.";
        } else if (error.code === 'auth/invalid-email') {
          msg = "The email address is invalid.";
        } else if (error.message) {
          msg = error.message;
        }
        setGeneralError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email above to reset password' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Enter a valid email address to reset password' });
      return;
    }

    setResetting(true);
    setGeneralError('');
    try {
      await resetPassword(email.trim());
      Alert.alert("Password Reset", "A password reset link has been sent to your email address.", [{ text: "OK" }]);
    } catch (error) {
      console.error("Reset password error:", error);
      let msg = "Failed to send reset email.";
      if (error.code === 'auth/user-not-found') {
        msg = "No account found with this email address.";
      } else if (error.message) {
        msg = error.message;
      }
      setGeneralError(msg);
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={fs(28)} color="#212121" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>NutriLens</Text>
            <View style={{ width: wp(8) }} />
          </View>

          {/* Titles */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>login to your account to continue!</Text>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={fs(16)} color="#E74C3C" style={{ marginRight: wp(2) }} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formContainer}>
            <InputField
              icon="mail"
              placeholder="E-mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              icon="lock"
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={resetting}
            >
              <Text style={styles.forgotPasswordText}>
                {resetting ? "Sending Reset Link..." : "Forgot Password?"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.backgroundWhite} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupLink} onPress={() => navigation?.navigate('SignUpScreen')}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupTextBold}>SignUp</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Waves */}
        <View style={styles.waveContainer} pointerEvents="none">
          <View style={[styles.circle, styles.circleLeft]} />
          <View style={[styles.circle, styles.circleRight]} />
          <View style={[styles.circle, styles.circleMiddle]} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF5EE',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(6),
    paddingBottom: hp(15),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + hp(1) : hp(1),
    marginBottom: hp(4),
  },
  backButton: {
    padding: wp(1),
    marginLeft: -wp(2.5),
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(20),
    color: '#2ECC71',
    letterSpacing: 0.5,
  },
  titleContainer: {
    marginBottom: hp(4),
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(34),
    color: '#2ECC71',
    marginBottom: hp(1),
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(15),
    color: '#333',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCEBEA',
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    marginBottom: hp(2.5),
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: fs(12),
    color: '#E74C3C',
    lineHeight: fs(12) * 1.5,
  },
  formContainer: {
    gap: hp(1.8),
  },
  inputWrapper: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5EFE6',
    borderWidth: 1,
    borderColor: '#2ECC71',
    borderRadius: wp(6.5),
    paddingHorizontal: wp(4),
    height: hp(6.5),
  },
  inputError: {
    borderColor: colors.primaryRed,
    backgroundColor: '#FCEBEA',
  },
  errorText: {
    color: colors.primaryRed,
    fontFamily: typography.fonts.medium,
    fontSize: fs(11),
    marginTop: hp(0.5),
    marginLeft: wp(4),
  },
  icon: {
    marginRight: wp(3),
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: fs(15),
    color: '#212121',
    height: '100%',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginRight: wp(2),
    marginTop: hp(0.3),
    marginBottom: hp(0.5),
  },
  forgotPasswordText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(13),
    color: '#2E7D32',
  },
  loginButton: {
    backgroundColor: '#009933',
    borderRadius: wp(6.5),
    height: hp(6.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignSelf: 'center',
    paddingHorizontal: wp(12),
    minWidth: wp(45),
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.backgroundWhite,
    fontFamily: typography.fonts.bold,
    fontSize: fs(17),
  },
  signupLink: {
    alignItems: 'center',
    marginTop: hp(2.5),
  },
  signupText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(15),
    color: '#2E7D32',
  },
  signupTextBold: {
    fontFamily: typography.fonts.extraBold,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(18),
    overflow: 'hidden',
    zIndex: -1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circleLeft: {
    width: wp(62),
    height: wp(62),
    backgroundColor: '#72DA96',
    bottom: -hp(18),
    left: -wp(25),
  },
  circleMiddle: {
    width: wp(80),
    height: wp(80),
    backgroundColor: '#5CD084',
    bottom: -hp(22),
    left: '50%',
    marginLeft: -wp(40),
  },
  circleRight: {
    width: wp(55),
    height: wp(55),
    backgroundColor: '#5CD084',
    bottom: -hp(15),
    right: -wp(20),
  },
});

export default LoginScreen;
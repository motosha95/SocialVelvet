import React from 'react';
import { StyleSheet, TextInput, View, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { useTheme } from '../../../theme/useTheme';
import { useAuthStore } from '../../../store/auth/authStore';
import type { AuthStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = NativeStackScreenProps<AuthStackParamList, typeof Routes.Auth.Register>;

export const RegisterScreen = ({ navigation }: Props): React.JSX.Element => {
  const theme = useTheme();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      header: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
      },
      fieldLabel: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
      },
      input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
      },
      cta: {
        marginTop: theme.spacing.md,
        opacity: isSubmitting ? 0.6 : 1,
      },
      error: {
        marginTop: theme.spacing.sm,
        color: theme.colors.danger,
      },
      footer: {
        marginTop: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.xs,
      },
      link: {
        color: theme.colors.primary,
      },
    });
  }, [isSubmitting, theme.colors.background, theme.colors.border, theme.colors.danger, theme.colors.primary, theme.colors.surface, theme.colors.text, theme.spacing.lg, theme.spacing.md, theme.spacing.sm, theme.spacing.xs]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const onSubmit = async (): Promise<void> => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email.trim(), password, name.trim());
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Logo size={100} style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.lg, alignSelf: 'center' }} />
        <View style={styles.header}>
          <AppText variant="title">Create account</AppText>
          <AppText color="muted">Join to discover and create events.</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.fieldLabel} color="muted">
            Full name
          </AppText>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
          />

          <AppText style={styles.fieldLabel} color="muted">
            Email
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
          />

          <AppText style={styles.fieldLabel} color="muted">
            Password
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
          />

          <AppText style={styles.fieldLabel} color="muted">
            Confirm password
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.mutedText}
            editable={!isSubmitting}
          />

          <Button label={isSubmitting ? 'Creating account…' : 'Create account'} onPress={onSubmit} style={styles.cta} />

          {error ? <AppText style={styles.error}>{error}</AppText> : null}

          <View style={styles.footer}>
            <AppText color="muted">Already have an account? </AppText>
            <AppText style={styles.link} onPress={() => navigation.navigate(Routes.Auth.Login)}>
              Sign in
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};


import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useTheme } from '../../../theme/useTheme';
import { useAuthStore } from '../../../store/auth/authStore';

export const LoginScreen = (): React.JSX.Element => {
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = React.useState<string>('dev@socializng.app');
  const [password, setPassword] = React.useState<string>('password');
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
    });
  }, [isSubmitting, theme.colors.background, theme.colors.border, theme.colors.danger, theme.colors.surface, theme.colors.text, theme.spacing.lg, theme.spacing.md, theme.spacing.sm, theme.spacing.xs]);

  const onSubmit = async (): Promise<void> => {
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Welcome back</AppText>
        <AppText color="muted">Sign in to see events and messages.</AppText>
      </View>

      <View style={styles.card}>
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
        />

        <Button label={isSubmitting ? 'Signing in…' : 'Sign in'} onPress={onSubmit} style={styles.cta} />

        {error ? <AppText style={styles.error}>{error}</AppText> : null}
      </View>
    </Screen>
  );
};

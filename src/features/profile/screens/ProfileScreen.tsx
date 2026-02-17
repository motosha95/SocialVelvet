import React from 'react';
import { ScrollView, StyleSheet, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../../components/layout/Screen';
import { AppText } from '../../../components/ui/AppText';
import { Button } from '../../../components/ui/Button';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { useAuthStore } from '../../../store/auth/authStore';
import { useUserStore } from '../../../store/user/userStore';
import { uploadApi } from '../../../api/uploadApi';
import { fixAvatarUrl } from '../../../utils/avatarUtils';
import type { ProfileStackParamList } from '../../../navigation/types';
import { Routes } from '../../../navigation/routes';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof Routes.Profile.Main>;

export const ProfileScreen = ({ navigation }: Props): React.JSX.Element => {
  const { theme, setMode } = useThemeContext();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useUserStore((s) => s.profile);
  const isLoading = useUserStore((s) => s.isLoading);
  const error = useUserStore((s) => s.error);
  const fetchProfile = useUserStore((s) => s.fetchProfile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [name, setName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [avatarLoadError, setAvatarLoadError] = React.useState(false);

  // Refetch profile when Profile tab is focused so avatar and data are always fresh
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
      setAvatarLoadError(false);
    }
  }, [profile]);

  const styles = React.useMemo(() => {
    return StyleSheet.create({
      container: {
        paddingTop: insets.top + theme.spacing.md,
        paddingBottom: insets.bottom + theme.spacing.xl,
      },
      header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
      },
      avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.border,
        marginBottom: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: theme.colors.primary + '40',
        ...theme.shadow('md'),
      },
      avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
      },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadow('sm'),
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
      textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
      },
      row: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
      },
      pointsBadge: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
      },
    });
  }, [theme.colors, theme.spacing, theme.shadow, insets.top, insets.bottom]);

  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      // Show instructions before opening picker
      alert('📸 Image Selection Instructions:\n\n1. Select an image from your gallery\n2. Adjust the crop area by dragging the corners\n3. To confirm: Look for the checkmark (✓) or "Done" button in the TOP-RIGHT corner of the screen\n4. If you don\'t see it, try tapping the top-right area - it may be partially hidden but still works');

      // Launch image picker with native editing
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile pictures
        quality: 0.8,
      });

      if (result.canceled) {
        return; // User canceled
      }

      if (!result.assets || result.assets.length === 0) {
        alert('No image selected');
        return;
      }

      // Upload the cropped image
      setIsUploading(true);
      try {
        const uploadResult = await uploadApi.uploadImage(result.assets[0].uri);
        await updateProfile({ avatarUrl: uploadResult.imageUrl });
        alert('Profile picture updated!');
      } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to open image picker. Please check app permissions.');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name, bio });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update profile');
    }
  };


  const toggleTheme = () => {
    setMode(theme.mode === 'dark' ? 'light' : 'dark');
  };

  if (isLoading && !profile) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <AppText color="muted" style={{ marginTop: theme.spacing.md }}>
            Loading profile...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!profile && error) {
    return (
      <Screen>
        <View style={[styles.loadingContainer, { paddingHorizontal: theme.spacing.lg }]}>
          <AppText color="muted" style={{ textAlign: 'center', marginBottom: theme.spacing.md }}>
            {error}
          </AppText>
          <AppText color="muted" style={{ textAlign: 'center', fontSize: 14, marginBottom: theme.spacing.lg }}>
            This may be due to an expired session. Try signing out and back in.
          </AppText>
          <Button label="Retry" onPress={() => fetchProfile()} style={{ marginBottom: theme.spacing.sm }} />
          <Button label="Sign out" variant="danger" onPress={() => void signOut()} />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <AppText color="muted">Unable to load profile.</AppText>
          <Button label="Retry" onPress={() => fetchProfile()} style={{ marginTop: theme.spacing.md }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading}>
            <View style={styles.avatar}>
              {profile?.avatarUrl && !avatarLoadError ? (
                <Image
                  key={profile.avatarUrl}
                  source={{ uri: fixAvatarUrl(profile.avatarUrl) ?? profile.avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <AppText variant="title">{profile?.name[0]?.toUpperCase()}</AppText>
              )}
            </View>
          </TouchableOpacity>
          <AppText variant="title">{profile?.name}</AppText>
          <AppText color="muted">{profile?.email}</AppText>
          <View style={[styles.pointsBadge, { marginTop: theme.spacing.sm }]}>
            <AppText style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 16 }}>
              ★ {profile?.points ?? 0} points
            </AppText>
            <AppText color="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {profile?.vipTier === 'vip' || profile?.vipTier === 'vip_plus'
                ? 'Double points when you attend (VIP)'
                : 'Earn points by attending events (ticket scanned)'}
            </AppText>
          </View>
          {(profile?.vipTier === 'vip' || profile?.vipTier === 'vip_plus') && (
            <View
              style={[
                styles.pointsBadge,
                {
                  marginTop: theme.spacing.sm,
                  backgroundColor: theme.colors.success + '20',
                  borderColor: theme.colors.success + '50',
                },
              ]}
            >
              <AppText style={{ color: theme.colors.success, fontWeight: '600', fontSize: 14 }}>
                👑 {profile.vipTier === 'vip_plus' ? 'VIP Plus' : 'VIP'}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.fieldLabel} color="muted">
            Name
          </AppText>
          {isEditing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!isUploading}
            />
          ) : (
            <AppText>{profile?.name}</AppText>
          )}

          <AppText style={styles.fieldLabel} color="muted">
            Bio
          </AppText>
          {isEditing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.colors.mutedText}
              editable={!isUploading}
            />
          ) : (
            <AppText>{profile?.bio || 'No bio yet.'}</AppText>
          )}

          <View style={styles.row}>
            {isEditing ? (
              <>
                <Button
                  label="Save"
                  onPress={handleSave}
                  style={{ flex: 1 }}
                  disabled={isUploading}
                />
                <Button
                  label="Cancel"
                  onPress={() => {
                    setIsEditing(false);
                    setName(profile?.name || '');
                    setBio(profile?.bio || '');
                  }}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <Button
                label="Edit Profile"
                onPress={() => setIsEditing(true)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
            <AppText style={{ fontSize: 22, marginRight: theme.spacing.xs }}>👑</AppText>
            <AppText style={styles.fieldLabel} color="muted">
              VIP
            </AppText>
          </View>
          <AppText style={{ marginBottom: theme.spacing.sm }}>
            Unlock early access, double points, exclusive events, and more.
          </AppText>
          <Button
            label="View VIP benefits"
            onPress={() => navigation.navigate(Routes.Profile.VIPSubscription)}
            variant="success"
            style={{ marginBottom: theme.spacing.md }}
          />
        </View>

        <View style={styles.card}>
          <AppText>Theme: {theme.mode}</AppText>
          <View style={styles.row}>
            <Button label="Toggle theme" onPress={toggleTheme} style={{ flex: 1 }} />
            <Button
              label="Sign out"
              onPress={() => void signOut()}
              variant="danger"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>

    </Screen>
  );
};

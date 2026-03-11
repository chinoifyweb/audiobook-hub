import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { authAPI } from '../lib/api';
import { downloadManager } from '../lib/storage';
import { COLORS, API_URL } from '../lib/constants';

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const { cleanup } = usePlayerStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [storageUsed, setStorageUsed] = useState('');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await cleanup();
          await logout();
        },
      },
    ]);
  };

  const handleEditProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      if (user) {
        setUser({ ...user, fullName: fullName.trim(), phone: phone.trim() });
      }
      Alert.alert('Success', 'Profile updated!');
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed!');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckStorage = async () => {
    try {
      const bytes = await downloadManager.getStorageUsed();
      const mb = (bytes / (1024 * 1024)).toFixed(1);
      const books = await downloadManager.getDownloadedBooks();
      Alert.alert('Storage', `${mb} MB used\n${books.length} books downloaded`);
    } catch {
      Alert.alert('Storage', 'Unable to check storage');
    }
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear Downloads',
      'This will remove all downloaded audiobooks from your device. You can re-download them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const books = await downloadManager.getDownloadedBooks();
            for (const bookId of books) {
              await downloadManager.deleteBook(bookId);
            }
            Alert.alert('Done', 'All downloads cleared');
          },
        },
      ]
    );
  };

  const menuItems = [
    { title: 'Edit Profile', icon: '✏️', onPress: () => { setFullName(user?.fullName || ''); setPhone(user?.phone || ''); setEditModalVisible(true); } },
    { title: 'Change Password', icon: '🔐', onPress: () => setPasswordModalVisible(true) },
    { title: 'Download Settings', icon: '📥', onPress: handleCheckStorage },
    { title: 'Clear Downloads', icon: '🗑️', onPress: handleClearDownloads },
    { title: 'Help & Support', icon: '❓', onPress: () => Linking.openURL(`${API_URL}/contact`) },
    { title: 'Terms of Service', icon: '📋', onPress: () => Linking.openURL(`${API_URL}/terms`) },
    { title: 'Privacy Policy', icon: '🔒', onPress: () => Linking.openURL(`${API_URL}/privacy`) },
    { title: 'About', icon: 'ℹ️', onPress: () => Linking.openURL(`${API_URL}/about`) },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditProfile} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (min 8 chars)"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPasswordModalVisible(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Change</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  userSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.white },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  menu: { marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuTitle: { flex: 1, fontSize: 16, color: COLORS.text },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },
  logoutBtn: { marginHorizontal: 20, marginTop: 24, backgroundColor: COLORS.surface, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.error },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.surfaceLight },
  cancelBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
